import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthResponseData } from '../auth.service';

import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {

  // Actions effects are an obvservable that differ from the observables we use in the reducers => we do not change any state, but execute any other code (side effects) when the reducer actions are done
  constructor(private actions$: Actions, private http: HttpClient, private router: Router) {}

  // ofType to specify to only continue in this observable chain if the action that we are reacting to is of type LOGIN_START (could add multiple here, but only specified the one)
  @Effect() // declare authLogin as an Effect
  authLogin = this.actions$.pipe(ofType(AuthActions.LOGIN_START),
  // use switchMap to create a new observable which takes another observable's data (AuthActions.LoginStart)
    switchMap((authData: AuthActions.LoginStart) => {
      return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebaseAPIKey}`, {
        email: authData.payload.email,
        password: authData.payload.password,
        returnSecureToken: true
      })
      // Call pipe on inner observable (not on overall chain). With catchError, we must return a non-error observable so that our overall stream does not die => since switchMap returns a result of the inner observable stream as a new observable to the outer chain, returning a non-error observable in catchError is crucial so that we still yeild a non-error observable to be picked up by switchMap and returned to the overall stream
      .pipe(
        map(resData => {
          // At this stage we have a successfully logged in user, so we want to return an observable that holds our login action
          const expirationDate = new Date(new Date().getTime() + +resData.expiresIn * 1000);
          return new AuthActions.Login({email: resData.email, userId: resData.localId, token: resData.idToken, expirationDate});
        }),
        catchError(errorRes => {
          let errorMessage = 'An unkown error occured';
          if (!errorRes.error || !errorRes.error.error) {
             // of is utility funciton for creating a new observable
            return of(new AuthActions.LoginFail(errorMessage));
          }
          switch (errorRes.error.error.message) {
            case 'EMAIL_EXISTS':
              errorMessage = 'This email already exists';
              break;
            case 'EMAIL_NOT_FOUND':
              errorMessage = 'This email does not exist';
              break;
            case 'INVALID_PASSWORD':
              errorMessage = 'This password is incorrect';
              break;
          }
          // Return a new action (return a new observable)
          return of(new AuthActions.LoginFail(errorMessage))
        })
      );
    })
  );

  // Let NgRx know that this effect will not yield a dispatchable action
  @Effect({dispatch: false})
  authSuccess = this.actions$.pipe(ofType(AuthActions.LOGIN), tap(() => {
    this.router.navigate(['/']);
  }));

}
