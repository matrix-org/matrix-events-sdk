import {NamespacedValue} from "../NamespacedValue";
import {Optional} from "../types";

type NS = NamespacedValue<string, string>;

/**
 * A `Map` implementation which accepts a NamespacedValue as a key, and arbitrary value. The
 * namespaced value must be a string type.
 */
export class NamespacedMap<V> {
    // protected to make tests happy for access
    protected internalMap = new Map<string, V>();

    /**
     * Creates a new map with optional seed data.
     * @param {Array<[NS, V]>} initial The seed data.
     */
    public constructor(initial?: [NS, V][]) {
        if (initial) {
            for (const val of initial) {
                this.set(val[0], val[1]);
            }
        }
    }

    /**
     * Gets a value from the map. If the value does not exist under
     * either namespace option, falsy is returned.
     * @param {NS} key The key.
     * @returns {Optional<V>} The value, or falsy.
     */
    public get(key: NS): Optional<V> {
        if (key.name && this.internalMap.has(key.name)) {
            return this.internalMap.get(key.name);
        }
        if (key.altName && this.internalMap.has(key.altName)) {
            return this.internalMap.get(key.altName);
        }

        return null;
    }

    /**
     * Sets a value in the map.
     * @param {NS} key The key.
     * @param {V} val The value.
     */
    public set(key: NS, val: V): void {
        if (key.name) {
            this.internalMap.set(key.name, val);
        }
        if (key.altName) {
            this.internalMap.set(key.altName, val);
        }
    }

    /**
     * Determines if any of the valid namespaced values are present
     * in the map.
     * @param {NS} key The key.
     * @returns {boolean} True if present.
     */
    public has(key: NS): boolean {
        return !!this.get(key);
    }

    /**
     * Removes all the namespaced values from the map.
     * @param {NS} key The key.
     */
    public delete(key: NS): void {
        if (key.name) {
            this.internalMap.delete(key.name);
        }
        if (key.altName) {
            this.internalMap.delete(key.altName);
        }
    }

    /**
     * Determines if the map contains a specific namespaced value
     * instead of the parent NS type.
     * @param {string} key The key.
     * @returns {boolean} True if present.
     */
    public hasNamespaced(key: string): boolean {
        return this.internalMap.has(key);
    }

    /**
     * Gets a specific namespaced value from the map instead of the
     * parent NS type. Returns falsy if not found.
     * @param {string} key The key.
     * @returns {Optional<V>} The value, or falsy.
     */
    public getNamespaced(key: string): Optional<V> {
        return this.internalMap.get(key);
    }
}
