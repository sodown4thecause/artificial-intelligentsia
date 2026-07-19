import koffi from "koffi";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface NativeLibrary {
  init(): number;
  store(service: string, account: string, secret: string): number;
  load(service: string, account: string, output: Buffer, length: Buffer): number;
  deleteCredential(service: string, account: string): number;
  freeString(secret: unknown): void;
}

const inMemoryCredentials = new Map<string, string>();

function credentialKey(service: string, account: string): string {
  return `${service}\u0000${account}`;
}

function defaultLibraryPath(): string {
  const extension = process.platform === "win32" ? "dll" : process.platform === "darwin" ? "dylib" : "so";
  return resolve(process.cwd(), "native", "zig", "zig-out", "lib", `creature_native.${extension}`);
}

export function loadNativeLib(): NativeLibrary | undefined {
  const libraryPath = process.env.CREATURE_NATIVE_LIB_PATH ?? defaultLibraryPath();
  if (!existsSync(libraryPath)) return undefined;

  try {
    const library = koffi.load(libraryPath);
    const native = {
      init: library.func("int creature_native_init(void)"),
      store: library.func("int creature_credential_store(const char *service, const char *account, const char *secret)"),
      load: library.func("int creature_credential_load(const char *service, const char *account, char **out_secret, size_t *out_len)"),
      deleteCredential: library.func("int creature_credential_delete(const char *service, const char *account)"),
      freeString: library.func("void creature_free_string(char *secret)"),
    } as NativeLibrary;
    if (native.init() !== 0) return undefined;
    return native;
  } catch {
    return undefined;
  }
}

export class NativeCredentialStore {
  private readonly native = loadNativeLib();

  async store(service: string, account: string, secret: string): Promise<void> {
    if (!this.native) {
      inMemoryCredentials.set(credentialKey(service, account), secret);
      return;
    }
    if (this.native.store(service, account, secret) !== 0) throw new Error("Unable to store credential");
  }

  async load(service: string, account: string): Promise<string> {
    if (!this.native) {
      const secret = inMemoryCredentials.get(credentialKey(service, account));
      if (secret === undefined) throw new Error("Credential not found");
      return secret;
    }

    const output = koffi.alloc("char *", 1) as Buffer;
    const length = koffi.alloc("size_t", 1) as Buffer;
    if (this.native.load(service, account, output, length) !== 0) throw new Error("Credential not found");
    const pointer = koffi.decode(output, "char *");
    const byteLength = koffi.decode(length, "size_t") as number;
    try {
      const bytes = koffi.decode(pointer, koffi.array("char", byteLength)) as number[];
      return Buffer.from(bytes).toString("utf8");
    } finally {
      this.native.freeString(pointer);
    }
  }

  async delete(service: string, account: string): Promise<void> {
    if (!this.native) {
      inMemoryCredentials.delete(credentialKey(service, account));
      return;
    }
    if (this.native.deleteCredential(service, account) !== 0) throw new Error("Unable to delete credential");
  }
}
