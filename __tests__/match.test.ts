import { checkRules } from "../src/match";
import { Action, Resource, Role } from "../src/types";

describe("By default policy is deny", () => {
  it("should fail with empty credentials and empty rules", async () => {
    expect(await checkRules([], [])).toBe(false);
    expect(await checkRules([], {})).toBe(false);
  });
  it("should fail with no empty credentials and empty rules", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        []
      )
    ).toBe(false);
  });
  it("should fail with empty credentials and no empty rules", async () => {
    expect(
      await checkRules([], {
        action: Action.CREATE,
        resource: Resource.COMMENT,
        role: Role.ADMIN
      })
    ).toBe(false);
  });
});

describe("Simple tests", () => {
  it("should pass when roles match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        {
          role: Role.ADMIN
        }
      )
    ).toBe(true);
  });
  it("should fail when roles do not match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        {
          role: Role.USER
        }
      )
    ).toBe(false);
  });

  it("should pass when all params match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        {
          action: Action.CREATE,
          resource: Resource.COMMENT,
          role: Role.ADMIN
        }
      )
    ).toBe(true);
  });
  it("should fail when some params do not match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.SPACE,
            role: Role.ADMIN
          }
        ],
        {
          action: Action.CREATE,
          resource: Resource.COMMENT,
          role: Role.ADMIN
        }
      )
    ).toBe(false);
  });
});

describe("Array (OR) tests", () => {
  it("should pass when params match and roles is and array of one element", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            role: Role.ADMIN
          }
        ]
      )
    ).toBe(true);
  });
  it("should pass when params match and roles is and array of multiple elements", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            role: Role.USER
          },
          {
            role: Role.ADMIN
          }
        ]
      )
    ).toBe(true);
  });
  it("should fail when params match and roles is and array without match values", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            role: Role.USER
          },
          {
            resource: Resource.SPACE
          }
        ]
      )
    ).toBe(false);
  });
  it("should pass when some of multiple credentials match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          },
          { role: Role.USER, action: Action.CREATE, resource: Resource.COMMENT }
        ],
        [
          {
            role: Role.USER
          },
          {
            resource: Resource.SPACE
          }
        ]
      )
    ).toBe(true);
  });
});

describe("Object (AND) tests", () => {
  it("should pass when all objects rules match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          },
          {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        ],
        {
          rule1: {
            role: Role.ADMIN
          },
          rule2: {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        }
      )
    ).toBe(true);
  });
  it("should fail when one objects rules do not match", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          },
          {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        ],
        {
          rule1: {
            role: Role.ADMIN
          },
          rule2: {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.USER
          },
          rule3: {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        }
      )
    ).toBe(false);
  });
});

describe("Array rule value tests", () => {
  it("should work when rule is an array of objects", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            role: Role.USER
          },
          {
            role: Role.ADMIN
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            role: Role.USER
          }
        ]
      )
    ).toBe(false);
  });
  it("should work when rule value is an array of rule values", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        {
          role: [Role.USER, Role.ADMIN]
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        {
          role: [Role.USER]
        }
      )
    ).toBe(false);
  });
});

describe("Complex Test", () => {
  it("should work mixing OR & AND", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            rule1: {
              role: Role.ADMIN
            },
            rule2: {
              resource: Resource.COMMENT
            }
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            rule1: {
              role: Role.ADMIN
            },
            rule2: {
              action: Action.SELECT
            }
          }
        ]
      )
    ).toBe(false);
  });
  it("should work with deepr nesting", async () => {
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            rule1: {
              role: Role.ADMIN
            },
            rule2: [
              {
                action: Action.SELECT
              },
              {
                action: Action.CREATE
              }
            ]
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            rule1: {
              role: Role.ADMIN
            },
            rule2: [
              {
                action: Action.SELECT
              },
              {
                action: Action.CREATE,
                role: Role.USER
              }
            ]
          }
        ]
      )
    ).toBe(false);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          },
          {
            action: Action.SELECT,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          },
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            rule1: {
              role: Role.ADMIN
            },
            rule2: [
              {
                action: Action.SELECT,
                resource: Resource.COMMENT
              },
              {
                action: Action.CREATE,
                role: Role.USER
              }
            ]
          }
        ]
      )
    ).toBe(true);
  });
});
