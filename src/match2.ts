import { isGuardValue } from "./types";

type Comparator<T, K> = (x: T, y: K) => Promise<boolean>;

function equalComparator<T>(x: T, y: T) {
  console.log(">>>>>equalComparator", x, y);
  return Promise.resolve(y === x);
}
function predicateComparator<T>(f: (x: T) => Promise<boolean>, x: T) {
  console.log(">>>>>predicateComparator", f, x);
  return f(x);
}

function someComparator<T, K>(
  comparator: Comparator<T, K>
): Comparator<T[], K> {
  return async (xs: T[], y: K) => {
    console.log(">>>>>someComparator", xs, y);
    for (const x of xs) {
      const match = await comparator(x, y);
      if (match) {
        return true;
      }
    }
    return false;
  };
}

function allComparator<T, K>(
  comparator: Comparator<T, K>
): Comparator<{ [index: string]: T }, K> {
  return async (obj: { [index: string]: T }, y: K) => {
    console.log(">>>>>allComparator", obj, y);
    let key: string;
    let hasCompare = false;
    for (key in obj) {
      hasCompare = true;
      const x = obj[key];
      const match = await comparator(x, y);
      if (!match) {
        return false;
      }
    }
    return hasCompare;
  };
}

function typeComparator<T, K>(inverse = false): Comparator<T, K> {
  return function(x: T, y: K | T) {
    console.log(">>>>>typeComparator", x, y);
    if (Array.isArray(x)) {
      return someComparator(typeComparator(inverse))(x, y);
    } else if (isGuardValue(x)) {
      return keyComparator(inverse)(x as any, y as any);
    } else if (typeof x === "object") {
      // @ts-ignore
      return allComparator(typeComparator(inverse))(x, y);
    } else if (typeof x === "function") {
      return predicateComparator(x as any, y);
    } else if (inverse) {
      return typeComparator(false)(y, x);
    }
    return equalComparator(x, y);
  };
}

function keyComparator<T, K>(inverse = false) {
  return async (objX: { [index: string]: T }, objY: { [index: string]: K }) => {
    console.log(">>>>>typeComparator", objX, objY);
    let match = true;
    for (const key in objX) {
      const valX = objX[key];
      if (!(key in objY)) {
        match = await missingKeyBehavior(key, valX, objY, inverse);
      } else {
        const valY = objY[key];
        match = await typeComparator(inverse)(valX, valY);
      }
      if (!match) {
        return false;
      }
    }
    return true;
  };
}

function missingKeyBehavior<T, K>(
  _key: string,
  valX: T,
  objY: K,
  inverse = false
) {
  console.log("########missingKeyBehavior", _key, valX, objY, inverse);
  if (!inverse) {
    return true;
  }
  return typeComparator(inverse)(valX, objY);
}

function compare(credentials: any, guards: any) {
  return typeComparator(true)(guards, credentials);
}

const myCredentials = {
  action: "GET"
};

const myGuards = {
  action: "GET",
  predicate: {
    x: async () => true,
    y: async (args: any) => {
      console.log("@@@@@", args);
      return false;
    }
  }
};

compare(myCredentials, myGuards).then(result => {
  console.log(">>>>>>", result);
});
