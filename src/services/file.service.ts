import { singleton } from "tsyringe";
import * as FS from "fs";
import * as Path from "path";

@singleton()
export class FileService {
  public readFile(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      FS.readFile(path, { encoding: "utf-8" }, (err, data) => (!!err ? reject(err) : resolve(data)));
    });
  }

  public resolvePath(...pathSegments: string[]): string {
    return Path.resolve(...pathSegments);
  }
}
