import { makeSecure, SecureConfig, SecureParams } from "./secure";
import { Guard } from "./types";

export function makeSecureDecorator<AdditionalDataType = any>(
  secureConfig: SecureConfig<AdditionalDataType>
) {
  const secure = makeSecure(secureConfig);
  return function Secure<ExtraDataType = any, ProtectedParamsDataType = any>(
    guards: Guard = {},
    secureParams: SecureParams<ExtraDataType, ProtectedParamsDataType> = {}
  ) {
    return function(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(
          target,
          propertyKey
        ) as PropertyDescriptor;
      }

      const originalMethod = descriptor.value;
      descriptor.value = function() {
        const args: any[] = [];
        for (let _i = 0; _i < arguments.length; _i++) {
          args[_i - 0] = arguments[_i];
        }

        return secure(guards, secureParams, args).then(result => {
          if (result === true) {
            return originalMethod.apply(this, args);
          } else if (typeof result === "function") {
            return result(...args);
          }
          return result;
        });
      };
    };
  };
}
