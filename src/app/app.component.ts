import { AsyncPipe, JsonPipe, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

export interface Job {
  id: string;
  status: string;
  dataType: string;
  requestID: string;
  requestStatusID: number;
  tier: string;
  missionID: number;
  createdAt: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, JsonPipe, ReactiveFormsModule, NgFor],
  template: `
    <form [formGroup]="filterForm">
      <input formControlName="requestId" placeholder="Request ID">
    </form>
    @if (filterForm.controls.requestId.errors) {
      <div>Valid number required</div>
    }
    <!-- {{ filterForm.controls.requestId.errors | json }} -->
    <!-- <pre>{{ jobs$ | async | json }}</pre> -->
    <table>
      <thead>
        <tr>
          <th>Request ID</th>
          <th>Status</th>
          <th>Data Type</th>
          <th>Request Status ID</th>
          <th>Tier</th>
          <th>Mission ID</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let job of filteredJobs$ | async">
          <td>{{ job.requestID }}</td>
          <td>{{ job.status }}</td>
          <td>{{ job.dataType }}</td>
          <td>{{ job.requestStatusID }}</td>
          <td>{{ job.tier }}</td>
          <td>{{ job.missionID }}</td>
          <td>{{ job.createdAt }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class AppComponent implements OnInit {
  
  private _httpClinent = inject(HttpClient);
  private _formBuilder = inject(FormBuilder);
  private _destroyRef = inject(DestroyRef);
  
  private _requestIdSubject = new BehaviorSubject<string>('');

  requestID$ = this._requestIdSubject.asObservable();

  filterForm = this._formBuilder.group({
    requestId: ['', [Validators.pattern("^[0-9]*$")]],
  });
  
  jobs$ = this._httpClinent.get('https://qa.coast.noaa.gov/dav/api/v1/admin/dashboard/jobs')
    .pipe(map((resp: any) => resp.jobs as Job[]));

  filteredJobs$ = combineLatest([
    this.jobs$,
    this.requestID$
  ]).pipe(
    map(([jobs, requestId]) => {
      return jobs.filter((job) => job.requestID.includes(requestId));
    })
  );
  
  ngOnInit(): void {
    this.filterForm.controls.requestId.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        if (this.filterForm.controls.requestId.valid) {
          this._requestIdSubject.next(value!.toString());
        }
      });
  }

}
