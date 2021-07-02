import { NgeDocSettings } from "nge/doc";

export const NGE_DOC: NgeDocSettings = {
    meta: {
        name: 'Ngedoc',
        root: '/docs/nge-doc/',
        logo: 'assets/images/nge.svg',
        backUrl: '/docs/nge-doc/getting-started',
        repo: {
            name: 'nge',
            url: 'https://github.com/mciissee/nge',
        }
    },
    pages: [
        {
            title: 'Getting Started',
            href: 'getting-started',
            renderer: 'assets/docs/nge-doc/getting-started.md'
        },
        {
            title: 'Installation',
            href: 'installation',
            renderer: 'assets/docs/nge-doc/installation.md'
        },
        {
            title: 'Usage',
            href: 'usage',
            renderer: 'assets/docs/nge-doc/usage.md'
        },
        {
            title: 'Advanced Usage',
            href: 'advanced-usage',
            renderer: 'assets/docs/nge-doc/advanced-usage.md'
        }
    ],
};
