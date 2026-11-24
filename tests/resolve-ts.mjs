// Pliki w utils/ importują się bez rozszerzeń ("./brand"), bo tak chce bundler.
// Node tego nie rozwiązuje, więc na czas testów dopisujemy ".ts".
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith('.') && !/\.\w+$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});
