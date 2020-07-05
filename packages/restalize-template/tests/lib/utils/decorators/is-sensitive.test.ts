import { IsSensitive } from "../../../../server/lib/utils/decorators/is-sensitive";

describe("@IsSensitive() decorator", () => {
  it("should mask a class property with 15 asterisks if decorated with @IsSensitive() without arguments", () => {
    class MyClass {
      username: string;
      @IsSensitive()
      password: string;
      constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
      }
    }

    const correctJSON = JSON.stringify({
      username: "ikenna",
      password: "***************",
    });

    const myInstance = new MyClass("ikenna", "secret");
    expect(JSON.stringify(myInstance)).toEqual(correctJSON);
  });

  it("should mask a class property with specified number of asterisks", () => {
    class MyClass2 {
      username: string;
      @IsSensitive({ maskLength: 5 })
      password: string;
      constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
      }
    }
    const correctJSON = JSON.stringify({
      username: "ikenna",
      password: "*****",
    });

    const myInstance = new MyClass2("ikenna", "secret");
    expect(JSON.stringify(myInstance)).toEqual(correctJSON);
  });

  it("should throw an exception if maskLength < 1", () => {
    try {
      class MyClass3 {
        username: string;
        @IsSensitive({ maskLength: -10 })
        password: string;
        constructor(username: string, password: string) {
          this.username = username;
          this.password = password;
        }
      }
      expect(true).toBe(false);
    } catch (exc) {
      expect(exc.message).toBe(
        "@IsSensitive Decorator: maskLength should be an integer greater than zero"
      );
    }
  });
});
