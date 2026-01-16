/**
 * Input validation schemas (no external dependencies)
 * Provides type-safe validation for API inputs
 */

export interface GeoQuery {
  lat: number;
  lon: number;
  radiusKm: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a geographic coordinate (latitude or longitude)
 */
function validateCoordinate(
  value: number,
  type: "lat" | "lon",
): ValidationError | null {
  if (type === "lat") {
    if (value < -90 || value > 90) {
      return {
        field: "lat",
        message: "Latitude must be between -90 and 90 degrees",
      };
    }
    if (Math.abs(value) < 1) {
      return { field: "lat", message: "Latitude accuracy too high near poles" };
    }
  } else {
    if (value < -180 || value > 180) {
      return {
        field: "lon",
        message: "Longitude must be between -180 and 180 degrees",
      };
    }
  }
  return null;
}

/**
 * Validates radius in kilometers
 */
function validateRadius(value: number): ValidationError | null {
  if (value < 1 || value > 500) {
    return {
      field: "radiusKm",
      message: "Radius must be between 1 and 500 kilometers",
    };
  }
  return null;
}

/**
 * Geographic query validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validates geographic query parameters from URL search params
 * Returns validated data or validation errors
 */
export function validateGeoQuery(
  searchParams: URLSearchParams,
): ValidationResult<GeoQuery> {
  const errors: ValidationError[] = [];

  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");
  const radiusStr = searchParams.get("radiusKm");

  // Parse and validate latitude
  const lat = latStr ? Number.parseFloat(latStr) : NaN;
  if (Number.isNaN(lat)) {
    errors.push({
      field: "lat",
      message: "Latitude is required and must be a number",
    });
  } else {
    const latError = validateCoordinate(lat, "lat");
    if (latError) errors.push(latError);
  }

  // Parse and validate longitude
  const lon = lonStr ? Number.parseFloat(lonStr) : NaN;
  if (Number.isNaN(lon)) {
    errors.push({
      field: "lon",
      message: "Longitude is required and must be a number",
    });
  } else {
    const lonError = validateCoordinate(lon, "lon");
    if (lonError) errors.push(lonError);
  }

  // Parse and validate radius (with default)
  const radius = radiusStr ? Number.parseFloat(radiusStr) : 50;
  if (Number.isNaN(radius)) {
    errors.push({ field: "radiusKm", message: "Radius must be a number" });
  } else {
    const radiusError = validateRadius(radius);
    if (radiusError) errors.push(radiusError);
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      lat,
      lon,
      radiusKm: Math.min(radius, 500), // Enforce max
    },
  };
}

/**
 * Formats validation errors into a single message string
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => `${e.field}: ${e.message}`).join("; ");
}
