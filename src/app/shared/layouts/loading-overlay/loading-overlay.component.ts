import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './loading-overlay.component.html',
})
export class LoadingOverlayComponent {
  isLoading$;

  constructor(private _loader: LoadingService) {
    this.isLoading$ = this._loader.loading$;
  }
}
