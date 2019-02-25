import { makeSecure, UserCredentials } from "../src/secure";
import { Action, Resource, Role, Rule } from "../src/types";

const getEmptyCredentials = (): Promise<UserCredentials> => Promise.resolve({});

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

describe("Basic secure tests", () => {
  it("should work with simple rules and guards", async () => {
    const s = makeSecure({ getCredentials });
    expect(
      await s({
        action: Action.CREATE,
        resource: Resource.COMMENT
      })
    ).toBe(true);
    expect(
      await s({
        action: Action.CREATE,
        resource: Resource.SPACE
      })
    ).toBe(false);
  });
  it("by default security policy is deny", async () => {
    expect(await makeSecure({ getCredentials: getEmptyCredentials })()).toBe(
      false
    );
    const s = makeSecure({ getCredentials });
    expect(await s()).toBe(false);
  });
  it("ADMIN role have full access", async () => {
    const s = makeSecure({
      getCredentials: () =>
        Promise.resolve({
          roles: [Role.ADMIN]
        })
    });
    expect(await s()).toBe(true);
    expect(await s({ role: Role.USER })).toBe(true);
  });
});
describe("should work when changing default returns", () => {
  it("secure could return a string", async () => {
    const s = makeSecure({
      getCredentials,
      onDefaultFail: "ko",
      onDefaultSuccess: "ok"
    });
    expect(
      await s({
        action: Action.CREATE,
        resource: Resource.COMMENT
      })
    ).toBe("ok");
    expect(
      await s({
        action: Action.CREATE,
        resource: Resource.SPACE
      })
    ).toBe("ko");
  });
  it("secure could return a function or an error", async () => {
    expect.assertions(2);
    const s = makeSecure({
      getCredentials,
      onDefaultFail: new Error("ko"),
      onDefaultSuccess: () => "ok"
    });
    expect(
      await s({
        action: Action.CREATE,
        resource: Resource.COMMENT
      })
    ).toBe("ok");
    try {
      await s({
        action: Action.CREATE,
        resource: Resource.SPACE
      });
    } catch (err) {
      expect(err.message).toBe("ko");
    }
  });
});
describe("should work when changing inline returns", () => {
  it("secure could return a string", async () => {
    const s = makeSecure({
      getCredentials,
      onDefaultFail: "ko",
      onDefaultSuccess: "ok"
    });
    expect(
      await s(
        {
          action: Action.CREATE,
          resource: Resource.COMMENT
        },
        {
          onFail: "KO",
          onSuccess: "OK"
        }
      )
    ).toBe("OK");
    expect(
      await s(
        {
          action: Action.CREATE,
          resource: Resource.SPACE
        },
        {
          onFail: "KO",
          onSuccess: "OK"
        }
      )
    ).toBe("KO");
  });
});
describe("can pass data and extraData", () => {
  const s = makeSecure<Action>({
    data: Action.CREATE,
    getCredentials
  });
  it("should pass data", async () => {
    expect(
      await s({
        action: (_: any, action: Action) =>
          Promise.resolve(action === Action.CREATE)
      })
    ).toBe(true);
  });
  it("should pass extra data", async () => {
    expect(
      await s<Resource>(
        {
          action: (_: any, action: Action, resource: Resource) =>
            Promise.resolve(
              action === Action.CREATE && resource === Resource.COMMENT
            )
        },
        {
          extraData: Resource.COMMENT
        }
      )
    ).toBe(true);
  });
});
