// 테스트 전용 로더: Node ESM이 .ts/.tsx 직접 실행 시 extensionless import와 "@/" 별칭을
// 못 푸는 문제를 우회한다(빌드는 bundler resolution이라 무관).
// production 코드는 idiomatic extensionless + "@/" 유지.
// 사용: node --import ./ts-resolve.mjs <test>.mjs
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const ROOT = pathToFileURL(process.cwd() + "/").href;

register(
  "data:text/javascript," +
    encodeURIComponent(`
const ROOT = ${JSON.stringify(ROOT)};
const EXT = ['.ts', '.tsx', '.js', '.jsx'];
export async function resolve(spec, ctx, next){
  let s = spec, c = ctx;
  if (s.startsWith('@/')) { s = ROOT + s.slice(2); c = { ...ctx, parentURL: ROOT }; }
  const relative = s.startsWith('./') || s.startsWith('../') || s.startsWith('file:');
  if (relative && !/\\.[mc]?[jt]sx?$/.test(s)) {
    try { return await next(s, c); } catch {}
    for (const e of EXT) { try { return await next(s + e, c); } catch {} }
  }
  return next(s, c);
}
`),
);
