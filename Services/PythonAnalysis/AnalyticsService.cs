using PharmacyApi.DTO.Python;
using System.Net.Http.Json;
using System.Text.Json;

namespace PharmacyApi.Services.PythonAnalysis
{
    public class AnalyticsService
    {
        private readonly HttpClient _httpClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public AnalyticsService(HttpClient httpClient)
        {
            _httpClient = httpClient;

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
                PropertyNameCaseInsensitive = true
            };
        }

        // 1. Profit & Loss Summary
        public async Task<ProfitLossSummaryDto?> GetProfitLossSummaryAsync(
            DateOnly? startDate = null,
            DateOnly? endDate = null)
        {
            try
            {
                var query = BuildDateQuery(startDate, endDate);

                return await _httpClient.GetFromJsonAsync<ProfitLossSummaryDto>(
                    $"analytics/profit-loss{query}",
                    _jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetProfitLossSummaryAsync] {ex.Message}");
                return null;
            }
        }

        // 2. Profit & Loss By Medicine
        public async Task<List<ProfitLossByMedicineDto>> GetProfitLossByMedicineAsync(
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            int limit = 50)
        {
            try
            {
                var query = BuildDateQuery(startDate, endDate);
                var separator = string.IsNullOrEmpty(query) ? "?" : "&";
                var fullQuery = $"{query}{separator}limit={limit}";

                var result =
                    await _httpClient.GetFromJsonAsync<List<ProfitLossByMedicineDto>>(
                        $"analytics/profit-loss/by-medicine{fullQuery}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetProfitLossByMedicineAsync] {ex.Message}");
                return new();
            }
        }

        // 3. Loss Making Medicines
        public async Task<List<ProfitLossByMedicineDto>> GetLossMakingMedicinesAsync(
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            int limit = 50)
        {
            try
            {
                var query = BuildDateQuery(startDate, endDate);
                var separator = string.IsNullOrEmpty(query) ? "?" : "&";
                var fullQuery = $"{query}{separator}limit={limit}";

                var result =
                    await _httpClient.GetFromJsonAsync<List<ProfitLossByMedicineDto>>(
                        $"analytics/loss-making-medicines{fullQuery}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetLossMakingMedicinesAsync] {ex.Message}");
                return new();
            }
        }

        // 4. Low Stock Medicines
        public async Task<List<LowStockMedicineDto>> GetStockAlertsAsync(
            int? threshold = null)
        {
            try
            {
                string query =
                    threshold.HasValue
                        ? $"?threshold={threshold.Value}"
                        : string.Empty;

                var result =
                    await _httpClient.GetFromJsonAsync<List<LowStockMedicineDto>>(
                        $"analytics/low-stock{query}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetStockAlertsAsync] {ex.Message}");
                return new();
            }
        }

        // 5. Supplier Lead Time
        public async Task<List<SupplierLeadTimeDto>> GetSupplierLeadTimesAsync(
            int monthsBack = 12)
        {
            try
            {
                var result =
                    await _httpClient.GetFromJsonAsync<List<SupplierLeadTimeDto>>(
                        $"analytics/supplier-lead-time?months_back={monthsBack}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetSupplierLeadTimesAsync] {ex.Message}");
                return new();
            }
        }

        // 6. Supplier Medicine Costs
        public async Task<List<SupplierMedicineCostDto>> GetSupplierMedicineCostsAsync(
            int supplierId)
        {
            try
            {
                var result =
                    await _httpClient.GetFromJsonAsync<List<SupplierMedicineCostDto>>(
                        $"analytics/suppliers/{supplierId}/medicine-costs",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetSupplierMedicineCostsAsync] {ex.Message}");
                return new();
            }
        }

        // 7. Top Selling Medicines
        public async Task<List<TopSellingMedicineDto>> GetTopSellingMedicinesAsync(
            DateOnly? startDate = null,
            DateOnly? endDate = null,
            int limit = 10)
        {
            try
            {
                var query = BuildDateQuery(startDate, endDate);
                var separator = string.IsNullOrEmpty(query) ? "?" : "&";
                var fullQuery = $"{query}{separator}limit={limit}";

                var result =
                    await _httpClient.GetFromJsonAsync<List<TopSellingMedicineDto>>(
                        $"analytics/top-medicines{fullQuery}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetTopSellingMedicinesAsync] {ex.Message}");
                return new();
            }
        }

        // 8. Expiring Soon Medicines
        public async Task<List<ExpiringSoonMedicineDto>> GetExpiringSoonMedicinesAsync(
            int daysAhead = 30)
        {
            try
            {
                var result =
                    await _httpClient.GetFromJsonAsync<List<ExpiringSoonMedicineDto>>(
                        $"analytics/expiring-soon?days_ahead={daysAhead}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetExpiringSoonMedicinesAsync] {ex.Message}");
                return new();
            }
        }

        // 9. Sales By Payment Method
        public async Task<List<SalesByPaymentMethodDto>> GetSalesByPaymentMethodAsync(
            DateOnly? startDate = null,
            DateOnly? endDate = null)
        {
            try
            {
                var query = BuildDateQuery(startDate, endDate);

                var result =
                    await _httpClient.GetFromJsonAsync<List<SalesByPaymentMethodDto>>(
                        $"analytics/sales-by-payment-method{query}",
                        _jsonOptions);

                return result ?? new();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetSalesByPaymentMethodAsync] {ex.Message}");
                return new();
            }
        }

        // Helper Method
        private string BuildDateQuery(DateOnly? start, DateOnly? end)
        {
            var queryParts = new List<string>();

            if (start.HasValue)
                queryParts.Add($"start_date={start.Value:yyyy-MM-dd}");

            if (end.HasValue)
                queryParts.Add($"end_date={end.Value:yyyy-MM-dd}");

            return queryParts.Count > 0
                ? "?" + string.Join("&", queryParts)
                : string.Empty;
        }
    }
}
