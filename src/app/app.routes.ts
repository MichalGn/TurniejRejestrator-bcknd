import { Routes } from '@angular/router';
import { ClubRegisterPage } from './pages/club-register-page/club-register-page';
import { Pagenotfound } from './pages/pagenotfound/pagenotfound';
import { loginGuard } from './_guards/login/login-guard';
import { HomePage } from './pages/admin/home-page/home-page';
import { Settings } from './pages/admin/settings/settings';
import { UserList } from './pages/admin/users/user-list/user-list';
import { IndividualRegisterPage } from './pages/individual-register-page/individual-register-page';
import { MainPage } from './pages/main-page/main-page';
import { RegistrationList, RegistrationStatus } from './pages/admin/registrations/registration-list/registration-list';
import { AllList } from './pages/admin/all/all-list/all-list';
import { PlayerList } from './pages/admin/players/player-list/player-list';
import { BillList } from './pages/admin/bills/bill-list/bill-list';
import { CoachList } from './pages/admin/coaches/coach-list/coach-list';
import { Panel } from './pages/admin/panel/panel';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'main' },
    { path: 'main', component: MainPage },
    { path: 'individualRegister', component: IndividualRegisterPage },
    { path: 'individualRegister/edit/:uuid', component: IndividualRegisterPage },
    { path: 'clubRegister', component: ClubRegisterPage },
    { path: 'clubRegister/edit/:uuid', component: ClubRegisterPage },
    { path: 'familyRegister', component: ClubRegisterPage },
    { path: 'familyRegister/edit/:uuid', component: ClubRegisterPage },
    { path: 'admin', component: HomePage,  canActivate: [loginGuard], children: [
        { path: 'unverifiedRegistration', component: RegistrationList,  canActivate: [loginGuard], data: { status: RegistrationStatus.Unverified } },
        { path: 'verifiedRegistration', component: RegistrationList,  canActivate: [loginGuard], data: { status: RegistrationStatus.Verified } },
        { path: 'removedRegistration', component: RegistrationList,  canActivate: [loginGuard], data: { status: RegistrationStatus.Removed } },
        { path: 'all', component: AllList,  canActivate: [loginGuard] },
        { path: 'coaches', component: CoachList,  canActivate: [loginGuard] },
        { path: 'players', component: PlayerList,  canActivate: [loginGuard] },
        { path: 'bills', component: BillList,  canActivate: [loginGuard] },
        { path: 'users', component: UserList,  canActivate: [loginGuard] },
        { path: 'settings', component: Settings,  canActivate: [loginGuard] },
        { path: 'panel', component: Panel,  canActivate: [loginGuard] },
    ]},
    // { path: '**', component: ClubRegisterPage },
    { path: '**', redirectTo: 'main' },
];
