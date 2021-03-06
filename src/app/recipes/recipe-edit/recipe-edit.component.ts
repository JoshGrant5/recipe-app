import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import * as RecipeActions from '../store/recipe.actions';

import { Store } from '@ngrx/store';

import * as fromApp from '../../store/app.reducer';
import * as RecipesActions from '../store/recipe.actions';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.css']
})
export class RecipeEditComponent implements OnInit, OnDestroy {
  id: number;
  editMode = false;
  recipeForm: FormGroup;
  owner_id: string;
  recipeMessage: string;

  private storeSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<fromApp.AppState>
  ) {}

  get controls() { // a getter!
    return (<FormArray>this.recipeForm.get('ingredients')).controls;
  }

  ngOnInit() {
    this.route.params.subscribe(
      (params: Params) => {
        // "+" converts into a number
        this.id = +params['id'];
        this.editMode = params['id'] != null;
        this.recipeMessage = this.editMode ? 'Edit Recipe' : 'My New Recipe';
        this.initForm();
      }
    );
  }

  onSubmit() {
    if (this.editMode) {
      this.store.dispatch(RecipesActions.updateRecipe({index: this.id, recipe: this.recipeForm.value}));
      this.store.dispatch(RecipeActions.storeRecipes());
    } else {
      this.store.dispatch(RecipesActions.addRecipe({recipe: this.recipeForm.value}));
      this.store.dispatch(RecipeActions.storeRecipes());
    }
    this.onCancel();
  }

  onAddIngredient() {
    (<FormArray>this.recipeForm.get('ingredients')).push(
      new FormGroup({
        'name': new FormControl(null, Validators.required),
        'quantity': new FormControl(null, [
          Validators.required,
          Validators.pattern(/^[1-9]+[0-9]*$/) // Validate that we are accepting a positive number
        ])
      })
    );
  }

  onDeleteIngredient(index: number) {
    (<FormArray>this.recipeForm.get('ingredients')).removeAt(index);
  }

  onCancel() {
    // Add back button functionality, taking us back one level from where we currently are
    this.router.navigate(['../'], {relativeTo: this.route});
  }

  ngOnDestroy() {
    if (this.storeSub) {
      this.storeSub.unsubscribe();
    }
  }

  // Prepopulate the form with selected recipe data for editing
  private initForm() {
    let recipeName = '';
    let recipeImagePath = '';
    let recipeDescription = '';
    let recipeOwnerId = this.owner_id;
    let recipeIngredients = new FormArray([]);
    let recipeInstructions = '';

    this.store.select('auth').subscribe(authState => {
      if (authState.user) {
        this.owner_id = authState.user.id;
      }
    });

    if (this.editMode) {
      this.storeSub = this.store.select('recipes').pipe(map(recipeState => {
        return recipeState.recipes.find((recipe, index) => {
          return index === this.id;
        });
      })).subscribe(recipe => {
        recipeName = recipe.name;
        recipeImagePath = recipe.imagePath;
        recipeDescription = recipe.description;
        recipeInstructions = recipe.instructions;
        if (recipe['ingredients']) {
          for (let ingredient of recipe.ingredients) {
            recipeIngredients.push(
              new FormGroup({
                'name': new FormControl(ingredient.name, Validators.required),
                'quantity': new FormControl(ingredient.quantity, [
                  Validators.required,
                  Validators.pattern(/^[1-9]+[0-9]*$/)
                ])
              })
            );
          }
        }
      })
    }

    this.recipeForm = new FormGroup({
      // Reference validators (do not call) so that Angular executes at time of validation
      'name': new FormControl(recipeName, Validators.required),
      'imagePath': new FormControl(recipeImagePath, Validators.required),
      'description': new FormControl(recipeDescription, Validators.required),
      'owner_id': new FormControl(recipeOwnerId),
      'ingredients': recipeIngredients,
      'instructions': new FormControl(recipeInstructions, Validators.required)
    });
    this.recipeForm.patchValue({
      owner_id: this.owner_id
    });
  }

}
