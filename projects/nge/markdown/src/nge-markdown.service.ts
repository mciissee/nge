import {
    Inject,
    Injectable,
    Optional
} from '@angular/core';
import * as marked from 'marked';
import { NgeMarkdownContribution } from './nge-markdown-contribution';
import { MarkedRenderer, MarkedTokenizer } from './marked-types';
import { NgeMarkdownConfig, NGE_MARKDOWN_CONFIG } from './nge-markdown-config';
import { NgeMarkdownTransformer } from './nge-markdown-transformer';
import { ResourceLoaderService } from '@mcisse/nge/services';

/**
 * Markdown compiler service.
 */
@Injectable({
    providedIn: 'root',
})
export class NgeMarkdownService {

    constructor(
        @Optional()
        @Inject(NGE_MARKDOWN_CONFIG)
        private readonly config: NgeMarkdownConfig,
        private readonly resourceLoader: ResourceLoaderService,
    ) {
        this.config = config || {};
    }

    /**
     * Compiles a markdown string to an html string.
     * @param options compilation options.
     * @returns A promise that resolve with the AST of the compiled markdown
     * (with the modifications of the contributions).
     */
    async compile(options: NgeMarkdownCompileOptions) {
        let markdown = this.trimIndent(options.markdown);
        if (options.isHtmlString) {
            markdown = this.decodeHtml(markdown);
        }

        const transformer = await this.createTransformer(options);
        const renderer = this.renderer(transformer);
        const tokenizer = this.tokenizer(transformer);

        const markedOptions: marked.MarkedOptions = {
            gfm: true,
            ...this.config,
            langPrefix: 'language-',
            renderer,
            tokenizer,
        };

        markdown = transformer.transformMarkdown(markdown);

        const tokens = transformer.transformAst(
            marked.lexer(markdown, markedOptions)
        );

        options.target.innerHTML = marked.parser(
            tokens,
            markedOptions
        );

        transformer.transformHTML(
            options.target
        );

        return tokens;
    }

    private async createTransformer(options: NgeMarkdownCompileOptions) {
        const contributions = [...(options.contributions || [])];
        const transformer = new NgeMarkdownTransformer(
            this.config,
        );

        const dependencies = [];
        for (const contrib of contributions) {
            if (contrib.dependencies) {
                dependencies.push(...(contrib.dependencies() || []));
            }
            contrib.contribute(transformer);
        }

        await this.resourceLoader.loadAllSync(
            dependencies
        ).toPromise();

        return transformer;
    }

    private renderer(transformer: NgeMarkdownTransformer) {
        const renderer = transformer.transformRenderer(
            this.config?.renderer || new MarkedRenderer()
        );
        return renderer;
    }

    private tokenizer(transformer: NgeMarkdownTransformer) {
        return transformer.transformTokenizer(
            this.config?.tokenizer || new MarkedTokenizer()
        );
    }

    private decodeHtml(html: string): string {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        return textarea.value;
    }

    private trimIndent(markdown: string): string {
        if (!markdown) {
            return '';
        }

        let indentStart: number;
        return markdown
            .split('\n')
            .map((line) => {
                let lineIdentStart = indentStart;
                if (line.length > 0) {
                    lineIdentStart = isNaN(lineIdentStart)
                        ? line.search(/\S|$/)
                        : Math.min(line.search(/\S|$/), lineIdentStart);
                }
                if (isNaN(indentStart)) {
                    indentStart = lineIdentStart;
                }
                return !!lineIdentStart ? line.substring(lineIdentStart) : line;
            })
            .join('\n');
    }
}

/**
 * Parameters of NgeMarkdownService `compile` method.
 */
interface NgeMarkdownCompileOptions {
    /** Markdown string to compile. */
    markdown: string;
    /** HTMLElement on which to render the compiled markdown.  */
    target: HTMLElement;
    /** Is the markdown contains html code? */
    isHtmlString?: boolean;
    /** List of contribution to use during the compilation. */
    contributions?: NgeMarkdownContribution[];
}
