import { makeSecureDecorator } from "../src/decorator";
import { UserCredentials } from "../src/secure";
import { Action, Resource, Role, Rule } from "../src/types";

const getCredentials = (): Promise<UserCredentials> => {
  const rules: Rule = [
    {
      action: [
        Action.CREATE,
        Action.DELETE,
        Action.UPDATE,
        Action.FIND,
        Action.GET
      ],
      resource: Resource.COMMENT,
      role: Role.ADMIN
    },
    {
      action: [Action.FIND, Action.GET],
      resource: Resource.SPACE,
      role: Role.USER
    }
  ];
  return Promise.resolve({
    rules
  });
};

describe("Decorator tests", () => {
  it("should fail with empty guards", async () => {
    const mockfn = jest.fn();
    const Secure = makeSecureDecorator({ getCredentials });
    class Test {
      @Secure()
      public fail() {
        return mockfn();
      }
    }
    const result = await new Test().fail();
    expect(mockfn.mock.calls.length).toBe(0);
    expect(result).toBe(false);
  });
  it("should success with Admin role", async () => {
    const mockfn = jest.fn(() => "ok");
    const Secure = makeSecureDecorator({
      getCredentials: () => Promise.resolve({ roles: [Role.ADMIN] })
    });
    class Test {
      @Secure()
      public success() {
        return mockfn();
      }
    }
    const result = await new Test().success();
    expect(mockfn.mock.calls.length).toBe(1);
    expect(result).toBe("ok");
  });
  it("should fail with insufficient credentials", async () => {
    const mockfn = jest.fn();
    const Secure = makeSecureDecorator({ getCredentials });
    class Test {
      @Secure({
        resource: Resource.COMMENT,
        role: Role.USER
      })
      public fail() {
        return mockfn();
      }
    }
    const result = await new Test().fail();
    expect(mockfn.mock.calls.length).toBe(0);
    expect(result).toBe(false);
  });
  it("should success with sufficient role", async () => {
    const mockfn = jest.fn(() => "ok");
    const Secure = makeSecureDecorator({
      getCredentials: () => Promise.resolve({ roles: [Role.ADMIN] })
    });
    class Test {
      @Secure({
        role: Role.USER
      })
      public success() {
        return mockfn();
      }
    }
    const result = await new Test().success();
    expect(mockfn.mock.calls.length).toBe(1);
    expect(result).toBe("ok");
  });
  it("if when onFail is a function, test is called with data and extra data parameters", async () => {
    expect.assertions(4);
    const mockfn = jest.fn();
    const Secure = makeSecureDecorator({ getCredentials, data: Action.CREATE });
    class Test {
      @Secure(
        {},
        {
          extraData: Resource.COMMENT,
          onFail: (action: Action, resource: Resource) => {
            expect(action).toBe(Action.CREATE);
            expect(resource).toBe(Resource.COMMENT);
            return "ko";
          }
        }
      )
      public fail() {
        return mockfn();
      }
    }
    const result = await new Test().fail();
    expect(mockfn.mock.calls.length).toBe(0);
    expect(result).toBe("ko");
  });
  it("if when onFail is a currified function, the currified receives the original args", async () => {
    expect.assertions(5);
    const mockfn = jest.fn();
    const Secure = makeSecureDecorator({ getCredentials, data: Action.CREATE });
    class Test {
      @Secure(
        {},
        {
          extraData: Resource.COMMENT,
          onFail: (action: Action, resource: Resource) => {
            expect(action).toBe(Action.CREATE);
            expect(resource).toBe(Resource.COMMENT);
            return (role: Role) => {
              expect(role).toBe(Role.GUESS);
              return "ko";
            };
          }
        }
      )
      public fail(_role: Role) {
        return mockfn();
      }
    }
    const result = await new Test().fail(Role.GUESS);
    expect(mockfn.mock.calls.length).toBe(0);
    expect(result).toBe("ko");
  });
  it("if params passed to the protected function are received by de secure funtion", async () => {
    expect.assertions(3);
    const mockfn = jest.fn(() => "ok");
    const Secure = makeSecureDecorator({
      getCredentials: () => Promise.resolve({})
    });
    class Test {
      @Secure((_, __, ___, [action]) => {
        expect(action).toBe(Action.CREATE);
        return Promise.resolve(action === Action.CREATE);
      })
      public success(_action: Action) {
        return mockfn();
      }
    }
    const result = await new Test().success(Action.CREATE);
    expect(mockfn.mock.calls.length).toBe(1);
    expect(result).toBe("ok");
  });
});
