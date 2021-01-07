import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { HttpClient } from '@angular/common/http';
import { switchMap, map, withLatestFrom, filter } from 'rxjs/operators';

import * as RecipesActions from './recipe.actions';
import { Recipe } from '../recipe.model';
import * as fromApp from '../../store/app.reducer';

@Injectable()
export class RecipeEffects {

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<fromApp.AppState>
  ) {};

  owner_id: string;

  fetchRecipes$ = createEffect(() =>
    this.actions$.pipe(ofType(RecipesActions.fetchRecipes), switchMap(() => {
    this.store.select('auth').subscribe(authState => {
      if (authState.user) {
        this.owner_id = authState.user.id;
      }
    });
    return this.http.get<Recipe[]>(
      'https://cooking-papa-default-rtdb.firebaseio.com/recipes.json'
    );
  }), map(recipes => {
    return recipes.map(recipe => {
      return {
        ...recipe,
        ingredients: recipe.ingredients ? recipe.ingredients : []
      };
    });
  }), map(recipes => {
    const filteredRecipes = recipes.filter(recipe => {
      return recipe.owner_id === this.owner_id;
    });
    return RecipesActions.setRecipes({recipes: filteredRecipes});
  })));

  // withLatestFrom allows us to merge a value of another observable into this observable stream
  // ofType gives us back actionData (not intersted in this) and the data we receive from withLatestFrom => use array destructing to grab these
  storeRecipes$ = createEffect(() =>
    this.actions$.pipe(ofType(RecipesActions.storeRecipes), withLatestFrom(this.store.select('recipes')), switchMap(([actionData, recipeState]) => {
    return this.http.put(
      'https://cooking-papa-default-rtdb.firebaseio.com/recipes.json',
      recipeState.recipes
    )
  })),
    {dispatch: false}
  );

}
