import { Action, isGuardValue, isRuleValue, Resource, Role } from "./types";

type Comparator<T, K> = (x: T, y: K) => Promise<boolean>;

const listComparator = (defaultMatch = true) =>
  function<T, K>(
    comparator: Comparator<T, K>,
    needCompare = false
  ): Comparator<T[], K> {
    return async (xs: T[] | { [index: string]: T }, y: K) => {
      console.log(">>>>>listComparator", xs, y, defaultMatch, needCompare);
      let hasCompare = false;
      for (const key in xs) {
        // @ts-ignore
        const x = xs[key];
        hasCompare = true;
        const match = await comparator(x, y);
        if (match === defaultMatch) {
          return defaultMatch;
        }
      }
      return !needCompare || (needCompare && hasCompare)
        ? !defaultMatch
        : defaultMatch;
    };
  };

const someComparator = listComparator(true);
const allComparator = listComparator(false);

function isPrimitive(x: any) {
  return (
    typeof x === "string" || typeof x === "boolean" || typeof x === "number"
  );
}

function typeComparator<T, K>(onMissingKey = false): Comparator<T, K> {
  return async function(x: T, y: K | T) {
    console.log(">>>>>typeComparator", onMissingKey, x, y);
    if (typeof x === "boolean") {
      return x;
    } else if (typeof y === "boolean") {
      return y;
    } else if (isPrimitive(x)) {
      return isPrimitive(y) ? x === y : typeComparator(!onMissingKey)(y, x);
    } else if (x instanceof Promise) {
      return typeComparator(onMissingKey)(await x, y);
    } else if (Array.isArray(x)) {
      return someComparator(typeComparator(onMissingKey), false)(x, y);
    } else if (isGuardValue(x)) {
      return isRuleValue(y)
        ? keyComparator(
            typeComparator(onMissingKey),
            missingKeyComparator(onMissingKey)
          )(x as any, y as any)
        : typeComparator(!onMissingKey)(y, x);
    } else if (typeof x === "object") {
      return allComparator(typeComparator(onMissingKey), true)(x as any, y);
    } else if (typeof x === "function") {
      return typeComparator(onMissingKey)(x(y), y);
    }
    return x === y;
  };
}

function missingKeyComparator<T, K>(
  onMissingKey = false,
  testKey = "predicate"
) {
  return (key: string) => (val: T, obj: K) => {
    if (key === testKey) {
      return typeComparator(onMissingKey)(val, obj);
    }
    return Promise.resolve(onMissingKey);
  };
}

function keyComparator<T, K>(
  matchKeyComparator: Comparator<T, K>,
  missingKeyComparator: (key: string) => Comparator<T, { [index: string]: K }>
) {
  return async (objX: { [index: string]: T }, objY: { [index: string]: K }) => {
    console.log(">>>>>keyComparator", objX, objY);
    let match = true;
    for (const key in objX) {
      const valX = objX[key];
      console.log("key>>>>>", key);
      if (!(key in objY)) {
        match = await missingKeyComparator(key)(valX, objY);
      } else {
        const valY = objY[key];
        console.log("ValX>>>>>", valX);
        console.log("ValX>>>>>", valY);
        match = await matchKeyComparator(valX, valY);
      }
      if (!match) {
        return false;
      }
    }
    return true;
  };
}

export default function secureComparator(credentials: any, guards: any) {
  return typeComparator(false)(guards, credentials);
}

const credentials: any = {
  action: Action.FIND,
  role: "QQ"
};
const guards: any = {
  guard2: {
    action: Action.FIND,
    role: "QQ"
  }
};

//compare(guards, credentials).then(r => console.log(r));
