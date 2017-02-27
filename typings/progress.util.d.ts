/**
 * type definitions for Progress JSDO  4.3.0 - progress.util.js
 *
 * Author(s): Traveleye
 */

export module progress {

    export module util {

        /**
         * Utility class that allows subscribing and unsubscribing from named events.
         *
         * @returns {progress.util.Observable}
         */
        export class Observable {

            /**
             * bind the specified function so it receives callbacks when the
             * specified event name is called. Event name is not case sensitive.
             * An optional scope can be provided so that the function is executed
             * in the given scope.  If no scope is given, then the function will be
             * called without scope.
             *
             * If the same function is registered for the same event a second time with
             * the same scope the original subscription is removed and replaced with the new function
             * to be called in the new scope.
             *
             * @param evt    The name of the event to bind a handler to. String. Not case sensitive.
             * @param fn     The function callback for the event . Function.
             * @param scope  The scope the function is to be run in. Object. Optional.
             */
            subscribe(evt: string, fn: any, scope?: any): void;

            /**
             * bind the specified function so it receives callbacks when the
             * specified event name is called. Event name is not case sensitive.
             * An optional scope can be provided so that the function is executed
             * in the given scope.  If no scope is given, then the function will be
             * called without scope.
             *
             * If the same function is registered for the same event a second time with
             * the same scope the original subscription is removed and replaced with the new function
             * to be called in the new scope.
             *
             * @param evt        The name of the event to bind a handler to. String. Not case sensitive
             * @param operation  The name of the operation to bind to. String. Case sensitive.
             * @param fn         The function callback for the event . Function.
             * @param scope      The scope the function is to be run in. Object. Optional.
             */
            subscribe(evt: string, operation: string, fn: any, scope?: any): void;

            /**
             * remove the specified function so it no longer receives events from
             * the given name. event name is not case sensitive.
             *
             * @param evt    Required. The name of the event for which to unbind the given function. String.
             * @param fn     Required. The function to remove from the named event. Function.
             * @param scope  Optional. The function scope in which to remove the listener. Object.
             */
            unsubscribe(evt: string, fn: any, scope?: any): void;

            /**
             * remove the specified function so it no longer receives events from
             * the given name. event name is not case sensitive.
             *
             * @param evt       Required. The name of the event for which to unbind the given function.
             *                  String. Not case sensitive
             * @param operation Required.  The name of the operation to receive events. String. Case Sensitive
             * @param fn        Required. The function to remove from the named event. Function.
             * @param scope     Optional. The function scope in which to remove the listener. Object.
             */
            unsubscribe(evt: string, operation: string, fn: any, scope?: any): void;

            /**
             * trigger an event of the given name, and pass the specified data to
             * the subscribers of the event. Event name is not case sensitive.
             * A variable numbers of arguments can be passed as arguments to the event handler.
             *
             * @param evt  The name of the event to fire. String.  Not case sensitive
             * @param args Optional.  A variable number of arguments to pass to the event handlers.
             */
            trigger(evt: string, ...args: any[]): void;

            /**
             * trigger an event of the given name, and pass the specified data to
             * the subscribers of the event. Event name is not case sensitive.
             * A variable numbers of arguments can be passed as arguments to the event handler.
             *
             * @param evt  The name of the event to fire.  String.  Not case sensitive.
             * @param operation The name of the operation. String.  Case sensitive
             * @param args Optional.  A variable number of arguments to pass to the event handlers.
             */
            trigger(evt: string, operation: string, ...args: any[]): void;

            /**
             * unbind all listeners from the given event. If the
             * evt is undefined, then all listeners for all events are unbound
             * evnt name is not case sensitive
             *
             * @param evt       Optional. The name of the event to unbind.  If not passed, then all events are unbound
             * @param operation Optional. The name of the operation. String.  Case sensitive
             */
            unsubscribeAll(evt?: string, operation?: string): void;
        }
    }

    export module data {

        /**
         * Utility class that saves/reads data to localStorage
         *
         * @returns {progress.data.LocalStorage}
         */
        export class LocalStorage {

            /**
             * puts an object/any with a key into the local storage
             */
            saveToLocalStorage(name: string, dataObj: any): void;

            /**
             * returns an object/any from the local storage
             */
            readFromLocalStorage(name: string): any;

            /**
             * removes an object/any from the local storage
             */
            clearLocalStorage(name: string);
        }
    }
}

