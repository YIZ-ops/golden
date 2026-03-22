import pg from 'pg';

const { Client } = pg;

const rawDatabaseUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

if (!rawDatabaseUrl) {
  throw new Error(
    '缺少数据库连接串，请配置 POSTGRES_URL_NON_POOLING / POSTGRES_URL / POSTGRES_PRISMA_URL。',
  );
}

const parsedDatabaseUrl = new URL(rawDatabaseUrl);
parsedDatabaseUrl.searchParams.delete('sslmode');

const args = process.argv.slice(2);
const count = readNumberArg(args, '--count', 20);
const rawCategories = readStringArg(args, '--categories');
const categories = rawCategories
  ? rawCategories
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  : [];
const delayMs = readNumberArg(args, '--delay-ms', 600);

const client = new Client({
  connectionString: parsedDatabaseUrl.toString(),
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  await client.connect();

  let inserted = 0;
  let duplicated = 0;

  for (let index = 0; index < count; index += 1) {
    const payload = await fetchHitokoto(categories);
    const categoryName = mapCategoryName(payload.type);

    const result = await client.query(
      `
        insert into public.quotes (
          source_quote_id,
          content,
          author,
          source,
          category,
          source_type,
          author_role
        )
        values ($1, $2, $3, $4, $5, 'hitokoto', 'unknown')
        on conflict (source_type, source_quote_id) do nothing
        returning id
      `,
      [
        payload.uuid,
        payload.hitokoto,
        payload.from_who ?? '佚名',
        payload.from ?? null,
        categoryName,
      ],
    );

    if (result.rowCount && result.rowCount > 0) {
      inserted += 1;
      console.log(`Inserted ${payload.uuid} ${truncate(payload.hitokoto)}`);
    } else {
      duplicated += 1;
      console.log(`Skipped duplicate ${payload.uuid}`);
    }

    if (index < count - 1) {
      await sleep(delayMs);
    }
  }

  console.log(`Finished. inserted=${inserted} duplicated=${duplicated}`);
} finally {
  await client.end().catch(() => undefined);
}

async function fetchHitokoto(categories) {
  const params = new URLSearchParams();

  for (const category of categories) {
    params.append('c', category);
  }

  const query = params.toString();
  const url = query ? `https://v1.hitokoto.cn/?${query}` : 'https://v1.hitokoto.cn/';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`一言请求失败，status=${response.status}`);
  }

  return response.json();
}

function mapCategoryName(code) {
  const categoryMap = new Map([
    ['a', '动画'],
    ['b', '漫画'],
    ['c', '游戏'],
    ['d', '文学'],
    ['e', '原创'],
    ['f', '来自网络'],
    ['g', '其他'],
    ['h', '影视'],
    ['i', '诗词'],
    ['j', '网易云'],
    ['k', '哲学'],
    ['l', '抖机灵'],
  ]);

  return categoryMap.get(code) ?? '动画';
}

function readNumberArg(args, name, defaultValue) {
  const raw = readStringArg(args, name);

  if (!raw) {
    return defaultValue;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} 必须是正整数。`);
  }

  return parsed;
}

function readStringArg(args, name) {
  const direct = args.find((item) => item.startsWith(`${name}=`));

  if (direct) {
    return direct.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function truncate(input, limit = 30) {
  return input.length <= limit ? input : `${input.slice(0, limit)}...`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
