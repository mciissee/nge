import { Inject, Injectable, OnDestroy, Optional } from '@angular/core';
import { of, Subject } from 'rxjs';
import { NgeMonacoConfig, NGE_MONACO_CONFIG } from '../monaco-config';
import { NgeMonacoContribution, NGE_MONACO_CONTRIBUTION } from '../contributions/monaco-contribution';

/** monaco editor cdn url hosted at cdnjs. */
export const MONACO_CDNJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.25.2';

/** monaco editor cdn url hosted at jsdeliver. */
export const MONACO_JS_DELIVER_URL = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.25.2';

const WINDOW = (window as any);

/**
 * Loads monaco editor using AMD loader.
 */
@Injectable({providedIn: 'root'})
export class NgeMonacoLoaderService implements OnDestroy {
    private readonly load$ = new Subject<typeof monaco>();

    private baseUrl = MONACO_CDNJS_URL;
    private loadPromise?: Promise<typeof monaco>;

    constructor(
        @Optional()
        @Inject(NGE_MONACO_CONFIG)
        private readonly config: NgeMonacoConfig,

        @Optional()
        @Inject(NGE_MONACO_CONTRIBUTION)
        private readonly contributions: NgeMonacoContribution[],
    ) {
        this.contributions = contributions || [];
    }

    async ngOnDestroy() {
        await this.deactivateContributions();
    }

    /**
     * Call the given `observer` function to extend monaco editor functionalities
     * once it will be available in `window.monaco`.
     *
     * The function will be called immediately if monaco api is already loaded.
     * @param observer observer object.
     * @returns A subscription object that should be unsubscribed later.
     */
    onLoadMonaco(observer: (arg: typeof monaco) => void) {
        if (typeof WINDOW.monaco === 'undefined') {
            return this.load$.asObservable().subscribe(observer);
        }
        return of(WINDOW.monaco as typeof monaco).subscribe(observer);
    }

    /**
     * Loads monaco editor if it is not loaded.
     */
    loadAsync() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        return this.loadPromise = new Promise(async (resolve) => {
             // https://stackoverflow.com/a/33635881
            // https://github.com/microsoft/monaco-editor/issues/662
            // https://github.com/microsoft/monaco-editor/issues/1249

            setTimeout(()  => {
                this.baseUrl = this.config?.assets || MONACO_CDNJS_URL;
                if (this.baseUrl.endsWith('/')) {
                    this.baseUrl = this.baseUrl.slice(0, this.baseUrl.length - 1);
                }

                this.addWorkers();

                if (!WINDOW.require) {
                    const script = document.createElement('script');
                    script.src = `${this.baseUrl}/min/vs/loader.js`
                    script.type = 'text/javascript';
                    script.onload = () => this.onLoad(resolve);
                    document.body.appendChild(script);
                } else {
                    this.onLoad(resolve);
                }
            }, 1000);
        });
    }

    private onLoad(resolve: (e: typeof monaco) => void): void {
        WINDOW.require.config({
            paths: { vs: this.baseUrl + '/min/vs' }
        });

        const locale = this.config?.locale || '';
        if (locale !== 'en') {
            WINDOW.require.config({
                'vs/nls': {
                    availableLanguages: { '*': locale },
                }
            });
        }

        WINDOW.require(['vs/editor/editor.main'], async () => {
            await this.activateContributions();
            this.load$.next(monaco);
            resolve(monaco);
        });
    }

    private addWorkers() {
        // https://github.com/microsoft/monaco-editor/blob/master/docs/integrate-amd-cross.md
        if (!this.baseUrl.startsWith('http')) {
            return;
        }

        const proxy = URL.createObjectURL(new Blob([`
            self.MonacoEnvironment = { baseUrl: '${this.baseUrl}/min' };
            importScripts('${this.baseUrl}/min/vs/base/worker/workerMain.js');
        `], { type: 'text/javascript' }));

        WINDOW.MonacoEnvironment = {
            baseUrl: this.baseUrl + '/min',
            getWorkerUrl: () => proxy,
            globalAPI: true,
        };
    }

    private async activateContributions(): Promise<void> {
        await Promise.all(this.contributions.map(e => e.activate()));
    }

    private async deactivateContributions(): Promise<void> {
        await Promise.all(this.contributions.map(e => {
            if (e.deactivate) {
                return e.deactivate();
            }
            return Promise.resolve();
        }));
    }

}

