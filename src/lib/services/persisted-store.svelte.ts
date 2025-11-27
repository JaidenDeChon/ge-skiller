import { tick } from 'svelte';

/**
 * Instantiates a LocalStorage object of the given type.
 */
export class LocalStorage<T> {
    #key: string;
    #version = $state(0);
    #listeners = 0;
    #value: T | undefined;

    constructor(key: string, initial?: T) {
        this.#key = key;
        this.#value = initial;

        if (typeof localStorage === 'undefined') {
            console.warn('LocalStorage is not available in this environment');
            return;
        }

        if (localStorage.getItem(this.#key) === null) {
            localStorage.setItem(this.#key, JSON.stringify(this.#value));
        }
    }

    #handler = (event: StorageEvent) => {
        if (event.storageArea !== localStorage) return;
        if (event.key !== this.#key) return;
        this.#version += 1;
    };

    get current() {
        // Access #version to trigger reactivity.
        this.#version.toString();

        const root = typeof localStorage !== 'undefined'
            ? JSON.parse(localStorage.getItem(this.#key) || 'null')
            : this.#value;

        const proxies = new WeakMap();

        const proxy = (value: unknown) => {
            if (typeof value !== 'object' || value === null) return value;

            let p = proxies.get(value);

            if (!p) {
                p = new Proxy(value, {
                    // Proxy getter.
                    get: (target, property) => {
                        this.#version.toString();
                        return proxy(Reflect.get(target, property));
                    },
                    // Proxy setter.
                    set: (target, property, value) => {
                        this.#version += 1;
                        Reflect.set(target, property, value);

                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem(this.#key, JSON.stringify(root));
                        }

                        return true;
                    }
                });

                proxies.set(value, p);
            }

            return p;
        };

        if ($effect.tracking()) {
            $effect(() => {
                if (this.#listeners === 0) window.addEventListener('storage', this.#handler);

                this.#listeners += 1;

                return async () => {
                    await tick();
                    this.#listeners -= 1;
                    if (this.#listeners === 0) window.removeEventListener('storage', this.#handler);
                }
            });
        }

        return proxy(root);
    }

    set current(value: T) {        
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.#key, JSON.stringify(value));
        }

        this.#version += 1;
    }
}
