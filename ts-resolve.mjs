// 테스트 전용 로더: Node ESM이 .ts 직접 실행 시 extensionless 상대 import를 못 푸는 문제를
// 우회한다(빌드는 bundler resolution이라 무관). production 코드는 idiomatic extensionless 유지.
// 사용: node --import ./ts-resolve.mjs <test>.mjs
import { register } from "node:module";
register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(spec, ctx, next){
  if((spec.startsWith('./')||spec.startsWith('../')) && !/\\.[mc]?[jt]sx?$/.test(spec)){
    try { return await next(spec, ctx); } catch { return await next(spec + '.ts', ctx); }
  }
  return next(spec, ctx);
}
`),
);
