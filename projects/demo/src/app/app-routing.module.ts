import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { NGE_DOC } from './docs/nge-doc';
import { NGE_MARKDOWN } from './docs/nge-markdown';
import { NGE_MONACO } from './docs/nge-monaco';


const routes: Routes = [
    {
        path: 'docs',
        loadChildren: () => import('nge/doc').then(m => m.NgeDocModule),
        data: [
            NGE_DOC,
            NGE_MONACO,
            NGE_MARKDOWN,
        ],
    },
    { path: '**', redirectTo: 'docs', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        scrollOffset: [0, 64],
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
        preloadingStrategy: PreloadAllModules
    })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
