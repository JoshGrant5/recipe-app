import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

// resolvers added to certain routes => will run resolver code before the route is loaded
const routes: Routes = [
  { path: 'recipes',
    loadChildren: () => import('./recipes/recipes.module')
    .then(module => module.RecipesModule)
  },
  { path: 'shopping-list',
    loadChildren: () => import('./shopping-list/shopping-list.module')
    .then(module => module.ShoppingListModule)
  },
  { path: 'authentication',
    loadChildren: () => import('./auth/auth.module')
    .then(module => module.AuthModule)
  },
  { path: '', redirectTo: '/recipes', pathMatch: 'full' },
  // Only load the module pointed to when the user visits the 'recipes' path (lazy loading) => loadChildren takes an inline import function, which returns a promise returning the module you may access
];

@NgModule({
  // Configure root router to preload all the modules as soon as possible
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
