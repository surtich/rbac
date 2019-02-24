import { checkRules } from "../src/match";
import { Action, Resource, Role, Rule, SingleCredential } from "../src/types";

describe("By default policy is deny", () => {
  it("should fail with empty credentials and empty rules", async () => {
    expect(await checkRules([], [])).toBe(false);
    expect(await checkRules([], {})).toBe(false);
    expect(await checkRules({}, [])).toBe(false);
    expect(await checkRules({}, {})).toBe(false);
    expect(await checkRules([{}], [])).toBe(false);
    expect(await checkRules({}, [{}])).toBe(false);
    expect(await checkRules({}, [{}, {}])).toBe(false);
    expect(await checkRules({}, { x: {}, y: {} })).toBe(false);
    expect(await checkRules({}, { role: Role.ADMIN })).toBe(false);
    expect(await checkRules([], { role: Role.ADMIN })).toBe(false);
    expect(await checkRules({ role: Role.ADMIN }, {})).toBe(false);
    expect(await checkRules({ role: Role.ADMIN }, [])).toBe(false);
    expect(await checkRules({}, { role: [Role.ADMIN] })).toBe(false);
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
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        ],
        {
          rule1: {
            role: Role.ADMIN
          },
          rule2: {
            action: Action.FIND,
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
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        ],
        {
          rule1: {
            role: Role.ADMIN
          },
          rule2: {
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.USER
          },
          rule3: {
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
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
              action: Action.FIND
            }
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
          }
        ],
        [
          {
            rule1: {
              rule1_1: { role: Role.ADMIN },
              rule1_2: { resource: Resource.COMMENT }
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
              rule1_1: { role: Role.USER },
              rule1_2: { resource: Resource.COMMENT }
            }
          }
        ]
      )
    ).toBe(false);
  });
  it("should work with deeper nesting", async () => {
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
                action: Action.FIND
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
                action: Action.FIND
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
            action: Action.FIND,
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
                action: Action.FIND,
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
describe("Crendential can be an object of simple keys", () => {
  it("should work with an object", async () => {
    expect(
      await checkRules(
        {
          action: Action.FIND,
          resource: Resource.COMMENT,
          role: Role.ADMIN
        },
        [
          {
            role: Role.ADMIN
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: Action.FIND,
          resource: Resource.COMMENT,
          role: Role.ADMIN
        },
        [
          {
            role: Role.USER
          }
        ]
      )
    ).toBe(false);
  });
});

describe("Crendential values can be an array", () => {
  it("should work with one rule array and simple credential", async () => {
    expect(
      await checkRules(
        {
          role: Role.USER
        },
        {
          role: [Role.ADMIN, Role.USER]
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          role: Role.USER
        },
        {
          role: [Role.ADMIN]
        }
      )
    ).toBe(false);
  });
  it("should work with one credential array and simple rule", async () => {
    expect(
      await checkRules(
        {
          role: [Role.ADMIN, Role.USER]
        },
        {
          role: Role.USER
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          role: [Role.USER]
        },
        {
          role: Role.ADMIN
        }
      )
    ).toBe(false);
  });
  it("should work with credential and rule being both arrays", async () => {
    expect(
      await checkRules(
        {
          role: [Role.ADMIN, Role.USER]
        },
        {
          role: [Role.USER]
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          role: [Role.USER]
        },
        {
          role: [Role.ADMIN]
        }
      )
    ).toBe(false);
  });
  it("should work with multiple keys of arrays", async () => {
    expect(
      await checkRules(
        {
          action: [Action.CREATE, Action.FIND],
          resource: [Resource.COMMENT, Resource.SPACE]
        },
        {
          resource: Resource.SPACE
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: [Action.CREATE, Action.FIND],
          resource: [Resource.COMMENT, Resource.SPACE]
        },
        {
          action: [Action.CREATE, Action.FIND],
          resource: [Resource.SPACE]
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: Action.CREATE,
          resource: Resource.COMMENT
        },
        {
          action: [Action.CREATE, Action.FIND],
          resource: Resource.COMMENT
        }
      )
    ).toBe(true);
  });
});

describe("Object rule value tests", () => {
  it("should work with rule values being objects", async () => {
    expect(
      await checkRules(
        {
          action: [Action.CREATE, Action.FIND],
          resource: Resource.COMMENT
        },
        {
          action: { action1: Action.CREATE, action2: Action.FIND },
          resource: Resource.COMMENT
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT
          },
          {
            action: Action.FIND
          }
        ],
        {
          action: { action1: Action.CREATE, action2: Action.FIND },
          resource: Resource.COMMENT
        }
      )
    ).toBe(false);
  });
  it("should work with deeper nested objects in rule", async () => {
    expect(
      await checkRules(
        {
          action: [Action.FIND, Action.GET],
          resource: Resource.COMMENT
        },
        {
          action: {
            actions1: [Action.CREATE, Action.FIND],
            actions2: [Action.GET, Action.UPDATE]
          },
          resource: Resource.COMMENT
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: [Action.FIND, Action.GET],
          resource: Resource.COMMENT
        },
        {
          action: {
            actions1: [Action.CREATE, Action.FIND],
            actions2: [Action.GET, Action.UPDATE],
            actions3: Action.DELETE
          },
          resource: Resource.COMMENT
        }
      )
    ).toBe(false);
    const rules: Rule = {
      action: [
        {
          actions1: [Action.GET, Action.FIND],
          actions2: {
            action2_1: Action.CREATE,
            action2_2: Action.DELETE
          }
        },
        Action.UPDATE
      ],
      resource: Resource.COMMENT
    };
    expect(
      await checkRules(
        {
          action: [Action.UPDATE],
          resource: Resource.COMMENT
        },
        rules
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: [Action.GET, Action.CREATE, Action.DELETE],
          resource: Resource.COMMENT
        },
        rules
      )
    ).toBe(true);
    expect(
      await checkRules(
        {
          action: [Action.CREATE, Action.DELETE],
          resource: Resource.COMMENT
        },
        rules
      )
    ).toBe(false);
    expect(
      await checkRules(
        {
          action: [Action.GET, Action.DELETE],
          resource: Resource.COMMENT
        },
        rules
      )
    ).toBe(false);
    expect(
      await checkRules(
        {
          action: [Action.GET, Action.CREATE, Action.DELETE]
        },
        rules
      )
    ).toBe(false);
  });
});
describe("Rule could be a function", () => {
  it("should work with naive functions", async () => {
    expect(await checkRules([], () => Promise.resolve(true))).toBe(true);
    expect(await checkRules([], () => Promise.resolve(false))).toBe(false);
  });
  it("if credential params are received by the function", async () => {
    expect(
      await checkRules([{ action: Action.GET }], ([{ action }]) => {
        return Promise.resolve(action === Action.GET);
      })
    ).toBe(true);
  });
  it("should work with array of functions", async () => {
    expect(
      await checkRules(
        [],
        [() => Promise.resolve(false), () => Promise.resolve(true)]
      )
    ).toBe(true);
    expect(
      await checkRules(
        [],
        [() => Promise.resolve(false), () => Promise.resolve(false)]
      )
    ).toBe(false);
  });
  it("should work with object of functions", async () => {
    expect(
      await checkRules([], {
        f: () => Promise.resolve(true),
        g: () => Promise.resolve(true)
      })
    ).toBe(true);
    expect(
      await checkRules([], {
        f: () => Promise.resolve(true),
        g: () => Promise.resolve(false)
      })
    ).toBe(false);
  });
});
describe("Rule value could be a function", () => {
  it("should work with naive functions", async () => {
    expect(
      await checkRules({}, { predicate: () => Promise.resolve(true) })
    ).toBe(true);
    expect(
      await checkRules([], { predicate: () => Promise.resolve(false) })
    ).toBe(false);
  });
  it("if credential value params are received by the function", async () => {
    expect(
      await checkRules([{ action: Action.GET }], ([{ action }]) => {
        return Promise.resolve(action === Action.GET);
      })
    ).toBe(true);
    expect(
      await checkRules(
        [{ action: Action.GET }, { resource: Resource.COMMENT }],
        ([{ action }, { resource }]) => {
          return Promise.resolve(
            action === Action.GET && resource === Resource.COMMENT
          );
        }
      )
    ).toBe(true);
  });
  it("if functions receives credentials params", async () => {
    expect(
      await checkRules([{ role: Role.ADMIN, action: Action.GET }], {
        action: Action.GET,
        predicate: (credential: SingleCredential) => {
          return Promise.resolve(
            credential.role === Role.ADMIN && credential.action === Action.GET
          );
        }
      })
    ).toBe(true);
    expect(
      await checkRules([{ role: Role.ADMIN, action: Action.GET }], {
        action: Action.DELETE,
        predicate: (credential: SingleCredential) => {
          return Promise.resolve(
            credential.role === Role.ADMIN && credential.action === Action.GET
          );
        }
      })
    ).toBe(false);
  });
  it("if functions are called multiple times when credential is an array", async () => {
    expect(
      await checkRules(
        [{ role: Role.ADMIN, action: Action.GET }, { action: Action.DELETE }],
        {
          predicate: (credential: SingleCredential) => {
            return Promise.resolve(
              (credential.role === Role.USER &&
                credential.action === Action.GET) ||
                credential.action === Action.DELETE
            );
          }
        }
      )
    ).toBe(true);
  });
});
describe("Regular Rule keys could be functions", () => {
  it("should work with naive functions", async () => {
    expect(await checkRules({}, { action: () => Promise.resolve(true) })).toBe(
      true
    );
    expect(await checkRules([], { action: () => Promise.resolve(false) })).toBe(
      false
    );
  });
  it("should receive credential values", async () => {
    expect(
      await checkRules(
        { action: Action.GET },
        {
          action: (actionCredentialValue: Action) => {
            return Promise.resolve(actionCredentialValue === Action.GET);
          }
        }
      )
    ).toBe(true);
  });
  it("should receive credential array values", async () => {
    expect(
      await checkRules(
        { action: [Action.GET, Action.FIND] },
        {
          action: (actionCredentialValue: Action) => {
            return Promise.resolve(actionCredentialValue.includes(Action.FIND));
          }
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        { action: [Action.GET] },
        {
          action: (actionCredentialValue: Action) => {
            return Promise.resolve(actionCredentialValue.includes(Action.FIND));
          }
        }
      )
    ).toBe(false);
  });
  it("should work with array of credentials", async () => {
    expect(
      await checkRules([{ action: Action.GET }, { action: Action.DELETE }], {
        action: (actionCredentialValue: Action) => {
          return Promise.resolve(actionCredentialValue.includes(Action.DELETE));
        }
      })
    ).toBe(true);
    expect(
      await checkRules([{ action: Action.GET }, { action: Action.DELETE }], {
        action: (actionCredentialValue: Action) => {
          return Promise.resolve(actionCredentialValue.includes(Action.CREATE));
        }
      })
    ).toBe(false);
  });
  it("should work with array of functions in rules", async () => {
    expect(
      await checkRules(
        { action: Action.FIND },
        {
          action: [
            (actionCredentialValue: Action) => {
              return Promise.resolve(actionCredentialValue === Action.GET);
            },
            (actionCredentialValue: Action) => {
              return Promise.resolve(actionCredentialValue === Action.FIND);
            }
          ]
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        { action: Action.CREATE },
        {
          action: [
            (actionCredentialValue: Action) => {
              return Promise.resolve(actionCredentialValue === Action.GET);
            },
            (actionCredentialValue: Action) => {
              return Promise.resolve(actionCredentialValue === Action.FIND);
            }
          ]
        }
      )
    ).toBe(false);
  });
  it("should work with array of functions in rules", async () => {
    expect(
      await checkRules(
        { action: [Action.FIND, Action.CREATE] },
        {
          action1: {
            action: (actionCredentialValue: Action) => {
              return Promise.resolve(
                actionCredentialValue.includes(Action.FIND)
              );
            }
          },
          action2: {
            action: (actionCredentialValue: Action) => {
              return Promise.resolve(
                actionCredentialValue.includes(Action.CREATE)
              );
            }
          }
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        { action: [Action.FIND, Action.CREATE] },
        {
          action1: {
            action: (actionCredentialValue: Action) => {
              return Promise.resolve(
                actionCredentialValue.includes(Action.FIND)
              );
            }
          },
          action2: {
            action: (actionCredentialValue: Action) => {
              return Promise.resolve(
                actionCredentialValue.includes(Action.GET)
              );
            }
          }
        }
      )
    ).toBe(false);
  });
  it("should work with multiple keys being functions in key rules", async () => {
    expect(
      await checkRules(
        { action: [Action.FIND, Action.CREATE], resource: Resource.COMMENT },
        {
          action: (actionCredentialValue: Action) => {
            return Promise.resolve(actionCredentialValue.includes(Action.FIND));
          },
          resource: (resourceCredentialValue: Resource) => {
            return Promise.resolve(
              resourceCredentialValue === Resource.COMMENT
            );
          }
        }
      )
    ).toBe(true);
    expect(
      await checkRules(
        { action: [Action.FIND, Action.CREATE], resource: Resource.SPACE },
        {
          action: (actionCredentialValue: Action) => {
            return Promise.resolve(actionCredentialValue.includes(Action.FIND));
          },
          resource: (resourceCredentialValue: Resource) => {
            return Promise.resolve(
              resourceCredentialValue === Resource.COMMENT
            );
          }
        }
      )
    ).toBe(false);
  });
});
