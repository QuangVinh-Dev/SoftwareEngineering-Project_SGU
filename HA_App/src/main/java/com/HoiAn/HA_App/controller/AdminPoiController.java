package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.AdminPoiResponse;
import com.HoiAn.HA_App.service.AdminPoiService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/pois")
public class AdminPoiController {
    private final AdminPoiService service;

    public AdminPoiController(AdminPoiService service) { this.service = service; }

    @GetMapping
    public List<AdminPoiResponse> list() { return service.list(); }

    @GetMapping("/{poiId}")
    public AdminPoiResponse get(@PathVariable int poiId) { return service.get(poiId); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminPoiResponse create(@Valid @RequestBody PoiRequest request) { return service.create(request.toServiceRequest()); }

    @PutMapping("/{poiId}")
    public AdminPoiResponse update(@PathVariable int poiId, @Valid @RequestBody PoiRequest request) {
        return service.update(poiId, request.toServiceRequest());
    }

    public record PoiRequest(
            @NotBlank @Size(max = 200) String name,
            @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") @Digits(integer = 3, fraction = 6) BigDecimal latitude,
            @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") @Digits(integer = 3, fraction = 6) BigDecimal longitude,
            @NotNull @Min(1) @Max(10000) Integer radius,
            @NotNull @Min(0) @Max(100) Integer priorityLevel,
            @Size(max = 10000) String originalDescription,
            @Size(max = 500) String directionLink,
            @NotBlank @Pattern(regexp = "ACTIVE|INACTIVE") String status
    ) {
        AdminPoiService.PoiMutationRequest toServiceRequest() {
            return new AdminPoiService.PoiMutationRequest(name, latitude, longitude, radius, priorityLevel,
                    originalDescription, directionLink, status);
        }
    }
}
