import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { OpenFoodFactsProductDTO } from '../models/meal.dto';
import { getApiUrl } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class FoodSearchService {
  private readonly API = `${getApiUrl()}/api/food`;

  constructor(private http: HttpClient) {}

  // Recherche de produits OpenFoodFacts (par nom)
  search(query: string): Observable<OpenFoodFactsProductDTO[]> {
    if (!query || query.trim().length < 2) return of([]);
    return this.http.get<OpenFoodFactsProductDTO[]>(`${this.API}/search`, {
      params: { q: query.trim() }
    });
  }
}
