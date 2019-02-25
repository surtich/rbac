import { checkGuard } from "../src/match";
import { Action, Guard, Resource, Role, SingleRule } from "../src/types";

describe("By default policy is deny", () => {
  it("should fail with empty rules and empty guards", async () => {
    expect(await checkGuard([], [])).toBe(false);
    expect(await checkGuard([], {})).toBe(false);
    expect(await checkGuard({}, [])).toBe(false);
    expect(await checkGuard({}, {})).toBe(false);
    expect(await checkGuard([{}], [])).toBe(false);
    expect(await checkGuard({}, [{}])).toBe(false);
    expect(await checkGuard({}, [{}, {}])).toBe(false);
    expect(await checkGuard({}, { x: {}, y: {} })).toBe(false);
    expect(await checkGuard({}, { role: Role.ADMIN })).toBe(false);
    expect(await checkGuard([], { role: Role.ADMIN })).toBe(false);
    expect(await checkGuard({ role: Role.ADMIN }, {})).toBe(false);
    expect(await checkGuard({ role: Role.ADMIN }, [])).toBe(false);
    expect(await checkGuard({}, { role: [Role.ADMIN] })).toBe(false);
  });
  it("should fail with no empty rules and empty guards", async () => {
    expect(
      await checkGuard(
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
  it("should fail with empty rules and no empty guards", async () => {
    expect(
      await checkGuard([], {
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
  it("should pass when some of multiple rules match", async () => {
    expect(
      await checkGuard(
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
  it("should pass when all objects guards match", async () => {
    expect(
      await checkGuard(
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
          guard1: {
            role: Role.ADMIN
          },
          guard2: {
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.USER
          }
        }
      )
    ).toBe(true);
  });
  it("should fail when one objects guards do not match", async () => {
    expect(
      await checkGuard(
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
          guard1: {
            role: Role.ADMIN
          },
          guard2: {
            action: Action.FIND,
            resource: Resource.COMMENT,
            role: Role.USER
          },
          guard3: {
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
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              role: Role.ADMIN
            },
            guard2: {
              resource: Resource.COMMENT
            }
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              role: Role.ADMIN
            },
            guard2: {
              action: Action.FIND
            }
          }
        ]
      )
    ).toBe(false);
    expect(
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              guard1_1: { role: Role.ADMIN },
              guard1_2: { resource: Resource.COMMENT }
            }
          }
        ]
      )
    ).toBe(true);
    expect(
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              guard1_1: { role: Role.USER },
              guard1_2: { resource: Resource.COMMENT }
            }
          }
        ]
      )
    ).toBe(false);
  });
  it("should work with deeper nesting", async () => {
    expect(
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              role: Role.ADMIN
            },
            guard2: [
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
      await checkGuard(
        [
          {
            action: Action.CREATE,
            resource: Resource.COMMENT,
            role: Role.ADMIN
          }
        ],
        [
          {
            guard1: {
              role: Role.ADMIN
            },
            guard2: [
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
      await checkGuard(
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
            guard1: {
              role: Role.ADMIN
            },
            guard2: [
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
      await checkGuard(
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
      await checkGuard(
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
  it("should work with one guard array and simple rule", async () => {
    expect(
      await checkGuard(
        {
          role: Role.USER
        },
        {
          role: [Role.ADMIN, Role.USER]
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          role: Role.USER
        },
        {
          role: [Role.ADMIN]
        }
      )
    ).toBe(false);
  });
  it("should work with one rule array and simple guard", async () => {
    expect(
      await checkGuard(
        {
          role: [Role.ADMIN, Role.USER]
        },
        {
          role: Role.USER
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          role: [Role.USER]
        },
        {
          role: Role.ADMIN
        }
      )
    ).toBe(false);
  });
  it("should work with rule and guard being both arrays", async () => {
    expect(
      await checkGuard(
        {
          role: [Role.ADMIN, Role.USER]
        },
        {
          role: [Role.USER]
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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
      await checkGuard(
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

describe("Object guard value tests", () => {
  it("should work with guard values being objects", async () => {
    expect(
      await checkGuard(
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
      await checkGuard(
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
  it("should work with deeper nested objects in guard", async () => {
    expect(
      await checkGuard(
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
      await checkGuard(
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
    const guard: Guard = {
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
      await checkGuard(
        {
          action: [Action.UPDATE],
          resource: Resource.COMMENT
        },
        guard
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          action: [Action.GET, Action.CREATE, Action.DELETE],
          resource: Resource.COMMENT
        },
        guard
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          action: [Action.CREATE, Action.DELETE],
          resource: Resource.COMMENT
        },
        guard
      )
    ).toBe(false);
    expect(
      await checkGuard(
        {
          action: [Action.GET, Action.DELETE],
          resource: Resource.COMMENT
        },
        guard
      )
    ).toBe(false);
    expect(
      await checkGuard(
        {
          action: [Action.GET, Action.CREATE, Action.DELETE]
        },
        guard
      )
    ).toBe(false);
  });
});
describe("Guard could be a function", () => {
  it("should work with naive functions", async () => {
    expect(await checkGuard([], () => Promise.resolve(true))).toBe(true);
    expect(await checkGuard([], () => Promise.resolve(false))).toBe(false);
  });
  it("if rule params are received by the function", async () => {
    expect(
      await checkGuard([{ action: Action.GET }], ([{ action }]) => {
        return Promise.resolve(action === Action.GET);
      })
    ).toBe(true);
  });
  it("should work with array of functions", async () => {
    expect(
      await checkGuard(
        [],
        [() => Promise.resolve(false), () => Promise.resolve(true)]
      )
    ).toBe(true);
    expect(
      await checkGuard(
        [],
        [() => Promise.resolve(false), () => Promise.resolve(false)]
      )
    ).toBe(false);
  });
  it("should work with object of functions", async () => {
    expect(
      await checkGuard([], {
        f: () => Promise.resolve(true),
        g: () => Promise.resolve(true)
      })
    ).toBe(true);
    expect(
      await checkGuard([], {
        f: () => Promise.resolve(true),
        g: () => Promise.resolve(false)
      })
    ).toBe(false);
  });
});
describe("Guard value could be a function", () => {
  it("should work with naive functions", async () => {
    expect(
      await checkGuard({}, { predicate: () => Promise.resolve(true) })
    ).toBe(true);
    expect(
      await checkGuard([], { predicate: () => Promise.resolve(false) })
    ).toBe(false);
  });
  it("if rule value params are received by the function", async () => {
    expect(
      await checkGuard([{ action: Action.GET }], ([{ action }]) => {
        return Promise.resolve(action === Action.GET);
      })
    ).toBe(true);
    expect(
      await checkGuard(
        [{ action: Action.GET }, { resource: Resource.COMMENT }],
        ([{ action }, { resource }]) => {
          return Promise.resolve(
            action === Action.GET && resource === Resource.COMMENT
          );
        }
      )
    ).toBe(true);
  });
  it("if functions receives rules params", async () => {
    expect(
      await checkGuard([{ role: Role.ADMIN, action: Action.GET }], {
        action: Action.GET,
        predicate: (rule: SingleRule) => {
          return Promise.resolve(
            rule.role === Role.ADMIN && rule.action === Action.GET
          );
        }
      })
    ).toBe(true);
    expect(
      await checkGuard([{ role: Role.ADMIN, action: Action.GET }], {
        action: Action.DELETE,
        predicate: (rule: SingleRule) => {
          return Promise.resolve(
            rule.role === Role.ADMIN && rule.action === Action.GET
          );
        }
      })
    ).toBe(false);
  });
  it("if functions are called multiple times when rule is an array", async () => {
    expect(
      await checkGuard(
        [{ role: Role.ADMIN, action: Action.GET }, { action: Action.DELETE }],
        {
          predicate: (rule: SingleRule) => {
            return Promise.resolve(
              (rule.role === Role.USER && rule.action === Action.GET) ||
                rule.action === Action.DELETE
            );
          }
        }
      )
    ).toBe(true);
  });
});
describe("Regular Guard keys could be functions", () => {
  it("should work with naive functions", async () => {
    expect(await checkGuard({}, { action: () => Promise.resolve(true) })).toBe(
      true
    );
    expect(await checkGuard([], { action: () => Promise.resolve(false) })).toBe(
      false
    );
  });
  it("should receive rule values", async () => {
    expect(
      await checkGuard(
        { action: Action.GET },
        {
          action: (actionRuleValue: Action) => {
            return Promise.resolve(actionRuleValue === Action.GET);
          }
        }
      )
    ).toBe(true);
  });
  it("should receive rule array values", async () => {
    expect(
      await checkGuard(
        { action: [Action.GET, Action.FIND] },
        {
          action: (actionRuleValue: Action) => {
            return Promise.resolve(actionRuleValue.includes(Action.FIND));
          }
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { action: [Action.GET] },
        {
          action: (actionRuleValue: Action) => {
            return Promise.resolve(actionRuleValue.includes(Action.FIND));
          }
        }
      )
    ).toBe(false);
  });
  it("should work with array of rules", async () => {
    expect(
      await checkGuard([{ action: Action.GET }, { action: Action.DELETE }], {
        action: (actionRuleValue: Action) => {
          return Promise.resolve(actionRuleValue.includes(Action.DELETE));
        }
      })
    ).toBe(true);
    expect(
      await checkGuard([{ action: Action.GET }, { action: Action.DELETE }], {
        action: (actionRuleValue: Action) => {
          return Promise.resolve(actionRuleValue.includes(Action.CREATE));
        }
      })
    ).toBe(false);
  });
  it("should work with array of functions in guards", async () => {
    expect(
      await checkGuard(
        { action: Action.FIND },
        {
          action: [
            (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue === Action.GET);
            },
            (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue === Action.FIND);
            }
          ]
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { action: Action.CREATE },
        {
          action: [
            (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue === Action.GET);
            },
            (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue === Action.FIND);
            }
          ]
        }
      )
    ).toBe(false);
  });
  it("should work with array of functions in guards", async () => {
    expect(
      await checkGuard(
        { action: [Action.FIND, Action.CREATE] },
        {
          action1: {
            action: (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue.includes(Action.FIND));
            }
          },
          action2: {
            action: (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue.includes(Action.CREATE));
            }
          }
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { action: [Action.FIND, Action.CREATE] },
        {
          action1: {
            action: (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue.includes(Action.FIND));
            }
          },
          action2: {
            action: (actionRuleValue: Action) => {
              return Promise.resolve(actionRuleValue.includes(Action.GET));
            }
          }
        }
      )
    ).toBe(false);
  });
  it("should work with multiple keys being functions in key guards", async () => {
    expect(
      await checkGuard(
        { action: [Action.FIND, Action.CREATE], resource: Resource.COMMENT },
        {
          action: (actionRuleValue: Action) => {
            return Promise.resolve(actionRuleValue.includes(Action.FIND));
          },
          resource: (resourceRuleValue: Resource) => {
            return Promise.resolve(resourceRuleValue === Resource.COMMENT);
          }
        }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { action: [Action.FIND, Action.CREATE], resource: Resource.SPACE },
        {
          action: (actionRuleValue: Action) => {
            return Promise.resolve(actionRuleValue.includes(Action.FIND));
          },
          resource: (resourceRuleValue: Resource) => {
            return Promise.resolve(resourceRuleValue === Resource.COMMENT);
          }
        }
      )
    ).toBe(false);
  });
});
describe("Rule keys could be funtions and objects", () => {
  it("should work with naive functions", async () => {
    expect(
      await checkGuard(
        { role: () => Promise.resolve(true) },
        { role: Role.ADMIN }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { role: () => Promise.resolve(false) },
        { role: Role.ADMIN }
      )
    ).toBe(false);
  });
  it("guards could receive simple guard params", async () => {
    expect(
      await checkGuard(
        { role: (role: Role) => Promise.resolve(role === Role.ADMIN) },
        { role: Role.ADMIN }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { role: (role: Role) => Promise.resolve(role === Role.USER) },
        { role: [Role.ADMIN, Role.USER] }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        { role: (role: Role) => Promise.resolve(role === Role.USER) },
        { role1: { role: Role.ADMIN }, role2: { role: Role.USER } }
      )
    ).toBe(false);
    expect(
      await checkGuard(
        {
          action: (action: Action) => Promise.resolve(action === Action.FIND),
          role: (role: Role) => Promise.resolve(role === Role.USER)
        },
        { role: Role.USER, action: Action.FIND }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          action: (action: Action) => Promise.resolve(action === Action.FIND),
          role: (role: Role) => Promise.resolve(role === Role.USER)
        },
        { role: Role.USER, action: Action.FIND }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          action: (action: Action) => Promise.resolve(action === Action.FIND),
          role: (role: Role) => Promise.resolve(role === Role.USER)
        },
        { role: Role.USER, action: Action.GET }
      )
    ).toBe(false);
    expect(
      await checkGuard(
        {
          action: (action: Action) => Promise.resolve(action === Action.FIND),
          role: (role: Role) => Promise.resolve(role === Role.USER)
        },
        [{ role: Role.USER, action: Action.GET }, { action: Action.FIND }]
      )
    ).toBe(true);
  });
  it("if guard can be an array of functions ", async () => {
    expect(
      await checkGuard(
        {
          role: [
            (role: Role) => Promise.resolve(role === Role.ADMIN),
            (role: Role) => Promise.resolve(role === Role.USER)
          ]
        },
        { role: Role.ADMIN }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          role: [
            (role: Role) => Promise.resolve(role === Role.ADMIN),
            (role: Role) => Promise.resolve(role === Role.USER)
          ]
        },
        { role1: { role: Role.ADMIN }, role2: { role: Role.USER } }
      )
    ).toBe(true);
    expect(
      await checkGuard(
        {
          role: [
            (role: Role) => Promise.resolve(role === Role.ADMIN),
            (role: Role) => Promise.resolve(role === Role.USER)
          ]
        },
        { role1: { role: Role.ADMIN }, role2: { role: Role.GUESS } }
      )
    ).toBe(false);
  });
});

describe("guard and rule function values can receive additional data", () => {
  it("if guard function receives the additional passed parameters", async () => {
    expect(
      await checkGuard<Action>(
        { role: Role.ADMIN, resource: Resource.COMMENT },
        ([{ role }], action) => {
          return Promise.resolve(
            role === Role.ADMIN && action === Action.CREATE
          );
        },
        Action.CREATE
      )
    ).toBe(true);
  });
  it("if role key guard function receives the additional passed parameters", async () => {
    expect(
      await checkGuard<Action>(
        { role: Role.ADMIN, resource: Resource.COMMENT },
        {
          role: (role: Role, action: Action) => {
            return Promise.resolve(
              role === Role.ADMIN && action === Action.CREATE
            );
          }
        },
        Action.CREATE
      )
    ).toBe(true);
  });
  it("if predicate key guard function receives the additional passed parameters", async () => {
    expect(
      await checkGuard<Action>(
        { role: Role.ADMIN, resource: Resource.COMMENT },
        {
          predicate: (rule: SingleRule, action: Action) => {
            return Promise.resolve(
              rule.role === Role.ADMIN && action === Action.CREATE
            );
          }
        },
        Action.CREATE
      )
    ).toBe(true);
  });

  it("if rule function receives the additional passed parameters", async () => {
    expect(
      await checkGuard<Action>(
        {
          role: (role, action) => {
            return Promise.resolve(
              role === Role.ADMIN && action === Action.CREATE
            );
          }
        },
        { role: Role.ADMIN },
        Action.CREATE
      )
    ).toBe(true);
  });
  it("if guard function receives the extra passed parameters", async () => {
    expect(
      await checkGuard<Action, Resource>(
        { role: Role.ADMIN },
        ([{ role }], action, resource) => {
          return Promise.resolve(
            role === Role.ADMIN &&
              action === Action.CREATE &&
              resource === Resource.COMMENT
          );
        },
        Action.CREATE,
        Resource.COMMENT
      )
    ).toBe(true);
  });
});

describe("guard could be an action", () => {
  it("if guard action is called", async () => {
    const mockfn = jest.fn().mockResolvedValue(true);
    expect(await checkGuard([], mockfn)).toBe(true);
    expect(mockfn.mock.calls.length).toBe(1);
  });
});
