import { NamespacedValue } from "./NamespacedValue";
import { Optional } from "./types";

export class NamespacedMap<V> {
    private internalMap = new Map<string, V>();

    public constructor(initial?: [NamespacedValue<string, string>, V][]) {
        if (initial) {
            for (const val of initial) {
                this.set(val[0], val[1]);
            }
        }
    }

    public get(key: NamespacedValue<string, string>): Optional<V> {
        if (this.internalMap.has(key.name)) {
            return this.internalMap.get(key.name);
        }
        if (this.internalMap.has(key.altName)) {
            return this.internalMap.get(key.altName);
        }

        return null;
    }

    public set(key: NamespacedValue<string, string>, val: V) {
        this.internalMap.set(key.name, val);
        this.internalMap.set(key.altName, val);
    }

    public has(key: NamespacedValue<string, string>): boolean {
        return !!this.get(key);
    }

    public delete(key: NamespacedValue<string, string>) {
        this.internalMap.delete(key.name);
        this.internalMap.delete(key.altName);
    }

    public hasNamespaced(key: string): boolean {
        return this.internalMap.has(key);
    }

    public getNamespaced(key: string): Optional<V> {
        return this.internalMap.get(key);
    }
}
