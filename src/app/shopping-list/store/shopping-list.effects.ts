import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { switchMap, map, withLatestFrom } from "rxjs/operators";
import { Ingredient } from "src/app/shared/ingredient.model";

import * as fromApp from '../../store/app.reducer';
import * as ShoppingListActions from './shopping-list.actions';

@Injectable()
export class ShoppingListEffects {

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<fromApp.AppState>
  ) {};

  owner_id: string;

  fetchIngredients$  = createEffect(() =>
    this.actions$.pipe(ofType(ShoppingListActions.fetchIngredients), switchMap(() => {
    this.store.select('auth').subscribe(authState => {
      if (authState.user) {
        this.owner_id = authState.user.id;
      }
    });
    return this.http.get<Ingredient[]>(
      'https://cooking-papa-default-rtdb.firebaseio.com/shopping-list.json'
    );
  }), map(ingredients => {
    return ingredients.map(ingredient => {
      return {
        ...ingredient
      };
    });
  }), map(ingredients => {
    const filteredIngredients = ingredients.filter(ingredient => {
      return ingredient.owner_id === this.owner_id;
    });
    return ShoppingListActions.setIngredients({ingredients: filteredIngredients});
  })));

  storeIngredients$ = createEffect(() =>
    this.actions$.pipe(ofType(ShoppingListActions.storeIngredients), withLatestFrom(this.store.select('shoppingList')), switchMap(([actionData, shoppingListState]) => {
    // If ingredient already in shopping list, add to quantity instead of creating a new list item
    const updatedIngredients = [];
    const ingredientNames = [];
    const ingredients = [...shoppingListState.ingredients];
    for (let ingredient of ingredients) {
      if (!ingredientNames.includes(ingredient.name)) {
        updatedIngredients.push({...ingredient});
        ingredientNames.push(ingredient.name);
      } else {
        for (let i = 0; i < updatedIngredients.length; i++) {
          if (updatedIngredients[i].name === ingredient.name) {
            updatedIngredients[i].quantity += ingredient.quantity;
          }
        }
      }
    }
    this.store.dispatch(ShoppingListActions.setIngredients({ingredients: updatedIngredients}));
    return this.http.put(
      'https://cooking-papa-default-rtdb.firebaseio.com/shopping-list.json',
      updatedIngredients
    )
  })),
    {dispatch: false}
  );

}
