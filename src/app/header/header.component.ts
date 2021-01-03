import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../shared/database.service';

import * as fromApp from '../store/app.reducer';
import * as AuthActions from '../auth/store/auth.actions';
import * as RecipeActions from '../recipes/store/recipe.actions';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  collapsed = true;
  private userSub: Subscription;
  authenticated: boolean = false;

  constructor(private databaseService: DatabaseService, private authService: AuthService, private store: Store<fromApp.AppState>) { }

  ngOnInit() {
    this.userSub = this.store.select('auth')
    // get back the authState object with a user key
      .pipe(map(authState => authState.user))
      // subscribe to the user key
      .subscribe(user => {
        this.authenticated = !user ? false : true;
      });
  }

  onSaveData() {
    this.databaseService.storeRecipes();
  }

  onFetchData() {
    this.store.dispatch(new RecipeActions.FetchRecipes());
  }

  onLogout() {
    this.store.dispatch(new AuthActions.Logout());
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }

}
