import { Reactive } from "@synx/frp";

/**
 * Combines multiple reactive values into a single reactive object
 */
export function combine<T extends Record<string, any>>(obj: { [K in keyof T]: T[K] | Reactive<T[K]> }): Reactive<T> {
  // Get initial values
  const initialValues: any = {};
  
  for (const key in obj) {
    initialValues[key] = obj[key] instanceof Object && 'get' in obj[key] 
      ? (obj[key] as Reactive<any>).get()
      : obj[key];
  }
  
  // Create result reactive
  const result = Reactive.of(initialValues as T);
  
  // Set up subscriptions for each reactive property
  const subscriptions: Array<() => void> = [];
  
  for (const key in obj) {
    if (obj[key] instanceof Object && 'subscribe' in obj[key]) {
      const reactive = obj[key] as Reactive<any>;
      
      const sub = reactive.subscribe((newValue) => {
        const currentValues = result.get();
        const newValues = { ...currentValues, [key]: newValue };
        (result as any).updateValueInternal(newValues);
      });
      
      subscriptions.push(sub);
    }
  }
  
  // Add cleanup function
  const originalCleanup = result.cleanup;
  (result as any).cleanup = () => {
    subscriptions.forEach(unsub => unsub());
    originalCleanup.call(result);
  };
  
  return result;
}
