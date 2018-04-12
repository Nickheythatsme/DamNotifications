import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentComponent } from './current/current.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: CurrentComponent},
  { path: 'test', component: CurrentComponent },
  { path: 'signup', component: CurrentComponent }
];


@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  declarations: [],
  exports: [RouterModule],
})

export class AppRoutingModule { }
