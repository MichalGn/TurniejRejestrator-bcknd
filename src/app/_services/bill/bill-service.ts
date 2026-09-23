import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface CreateOrUpdateBillDataReq {
  billId: number | undefined;
  userId: number;
  registrationId: number | null;

  purchaser: string;
  nip: string;
  billNumberAuto: boolean;
  billNumberManPrefix: number | null;

  billPaymentDescLine1: string;
  billPaymentValueLine1: number;

  billPaymentDescLine2: string | null;
  billPaymentValueLine2: number | null;

  billPaymentDescLine3: string | null;
  billPaymentValueLine3: number | null;

  billTotalValue: number;
  paymentMethod: string;
  email: string | null;
  suffixPdfName: string | null;
  comment: string | null;


}

export interface BillData {
  id: number | undefined;
  registerId: number | undefined;
  billnumber: string | undefined;
  //datetime: string | undefined;
  datetime?: number[] | string | null;
  purchaser: string;
  cashAmount: number;
  transferAmount: number;
  paymentMethod: string;
  email: string | undefined;
  comment: string | undefined;
}

const API = environment.apiUrl + 'bill';
const httpOptions = { headers: new HttpHeaders().set('content-type', 'application/json') };

@Injectable({
  providedIn: 'root'
})
export class BillService {
  private http = inject(HttpClient);

  countBills(): Observable<any> {
    return this.http.get<any>(`${API}/counts`, httpOptions);
  }

  findMaxBillNumber(): Observable<any> {
    return this.http.get<any>(`${API}/findMaxBillNumber`, httpOptions);
  }

  findById(billId:number): Observable<any> {
    return this.http.get<any>(`${API}/${billId}`, httpOptions);
  }

  create(payload: CreateOrUpdateBillDataReq): Observable<{ billId: number }> {
    return this.http.post<{ billId: number }>(`${API}`, payload, httpOptions);
  }

  sendBillEmail(billId: number, email: string, fileName: string, pdfBase64: string): Observable<any> {
    return this.http.post(`${API}/${billId}/send-email`, {
      email,
      fileName,
      pdfBase64
    }, httpOptions);
  }

  update(payload: CreateOrUpdateBillDataReq): Observable<unknown> {
    return this.http.put(`${API}`, payload, httpOptions);
  }

  delete(billId: number): Observable<any> {
    return this.http.delete(`${API}/${billId}`, httpOptions);
  }

  deleteAll(): Observable<any> {
    return this.http.delete(`${API}/all`, httpOptions);
  }
  
  readAll(): Observable<unknown> {
    return this.http.get(`${API}/all`, httpOptions);
  }

  count(): Observable<number> {
    return this.http
      .get<{ billsCnt: number }>(`${API}/counts`, httpOptions)
      .pipe(map(response => Number(response?.billsCnt ?? 0)));
  }

}
