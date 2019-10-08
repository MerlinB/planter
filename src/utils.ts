import * as bsv from "bsv";

export function getRandomKeyPath(): string {
  const maxLength = 9;
  const path = bsv.PrivateKey.fromRandom()
    .toBigNumber()
    .toString()
    .split("")
    .reduce((r, e, i) => {
      i % maxLength === 0 ? r.push([e]) : r[r.length - 1].push(e);
      return r;
    }, [])
    .map(e => e.join(""))
    .join("/");
  return "m/" + path;
}
