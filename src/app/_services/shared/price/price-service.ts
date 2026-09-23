import { inject, Injectable, OnInit } from '@angular/core';
import { GeneralSettingsService } from '../../general-settings/general-settings-service';
import { BehaviorSubject, catchError, concatMap, finalize, from, of, tap } from 'rxjs';
import { Category, Games, Gender } from '../registration/registration-service';

export interface CoachPriceCalcInput {
  gender: Gender;
  nights: { friSat: boolean; satSun: boolean };
  meals: { supperFri: boolean; dinnerSat: boolean | undefined; supperSat: boolean; dinnerSun: boolean };
}

export interface PlayerPriceCalcInput {
  //gender: Gender | null;
  category: Category | null;
  games: Games | null;
  nights: { friSat: boolean; satSun: boolean };
  meals: { supperFri: boolean; dinnerSat: boolean; supperSat: boolean; dinnerSun: boolean };
}

//type SettingRow = { key1: string; value1: number };
type SettingRow = { key1: string; data: number };

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  private generalSettingsService = inject(GeneralSettingsService);

  private readonly KEYS = [
    'kt_1g_0n', 'kt_1g_1n', 'kt_1g_2n',
    'kt_2g_0n', 'kt_2g_1n', 'kt_2g_2n',
    'gp_1g_0n', 'gp_1g_1n', 'gp_1g_2n',
    'gp_2g_0n', 'gp_2g_1n', 'gp_2g_2n',
    'zak_1g_0n', 'zak_1g_1n', 'zak_1g_2n',
    'tr_1n', 'tr_2n',
    'tr_1n_s', 'tr_2n_s',
    'dinner', 'supper'
  ];

  /** all fetched prices live here */
  private priceMap = new Map<string, number>();

  /** emit true when all keys have been fetched (successfully or with misses) */
  readonly loaded$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.loadPricesOneByOne();
    console.log("priceMap:", this.priceMap)
  }

  /** Public helper if you ever want to re-read from server */
  refresh(): void {
    this.priceMap.clear();
    this.loaded$.next(false);
    this.loadPricesOneByOne();
  }

  /** Fetch every key sequentially (one-by-one). Missing keys are just skipped. */
  private loadPricesOneByOne(): void {
    from(this.KEYS)
      .pipe(
        concatMap(k =>
          this.generalSettingsService.findByKey1(k).pipe( // <-- your API that returns e.g. {key1,value1}
            tap((row: SettingRow) => {
              if (row) {//} && row.key1) {
                this.priceMap.set(String(k).trim().toLowerCase(), Number(row.data ?? 0));
              }
            }),
            // don’t fail the chain on a single 404/500; just skip that key
            catchError(() => of(null))
          )
        ),
        finalize(() => this.loaded$.next(true))
      )
      .subscribe();
  }

  calculateTotalCoach(input: CoachPriceCalcInput): number {
    const nights = (input.nights.friSat ? 1 : 0) + (input.nights.satSun ? 1 : 0);
    var baseKey = `tr_${nights}n`;

    console.log("aaa, baseKey:", baseKey)
    console.log("aab", "gender:", input.gender);
    if (input.gender === "s") {
      baseKey += "_s";
    }
    console.log("aac, baseKey:", baseKey)

    let total = this.get(baseKey);
    if (input.meals.supperFri) total += this.get('supper');
    if (input.meals.dinnerSat) total += this.get('dinner');
    if (input.meals.supperSat) total += this.get('supper');
    if (input.meals.dinnerSun) total += this.get('dinner');

    return total;
  }

  calculateTotalPlayer(input: PlayerPriceCalcInput): number {

    const nights = (input.nights.friSat ? 1 : 0) + (input.nights.satSun ? 1 : 0);
    const baseKey = `${input.category?.toLowerCase()}_${input.games}_${nights}n`;

    let total = this.get(baseKey);
    if (input.meals.supperFri) total += this.get('supper');
    if (input.category === 'ZAK' && input.meals.dinnerSat) total += this.get('dinner');
    if (input.meals.supperSat) total += this.get('supper');
    if (input.meals.dinnerSun) total += this.get('dinner');

    return total;
  }


  /** Safe getter: no fallback table — returns 0 if key wasn’t loaded/found */
  private get(key: string): number {
    const k = key.toLowerCase();
    return this.priceMap.has(k) ? this.priceMap.get(k)! : 0;
  }
}