export const extractErrorMessage = (error: any): string => {
    console.log("Full error object:", error);
  
    try {
      const messages: string[] = [];
      let data = error?.response?.data;
  
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return data.trim() || "An unexpected error occurred.";
        }
      }
  
      // CASE : response.data.message (FIRST)
      if (typeof data?.message === "string") {
        messages.push(data.message);
      }
  
      // CASE : errors[] (array of strings or objects)
      if (Array.isArray(data?.errors)) {
        data.errors.forEach((err: any) => {
          if (typeof err === "string") {
            messages.push(err);
          } else if (err?.message) {
            messages.push(err.message);
          }
        });
      }
  
      // CASE : detail array (FastAPI / Pydantic)
      if (Array.isArray(data?.detail)) {
        data.detail.forEach((detail: any) => {
          const location = Array.isArray(detail?.loc)
            ? detail.loc.join(" → ")
            : "Unknown location";
  
          const msg = detail?.msg || "Validation error";
          messages.push(`${location}: ${msg}`);
        });
      }
  
      // CASE : top-level detail array
      if (Array.isArray(error?.detail)) {
        error.detail.forEach((detail: any) => {
          const location = Array.isArray(detail?.loc)
            ? detail.loc.join(" → ")
            : "Unknown location";
  
          const msg = detail?.msg || "Validation error";
          messages.push(`${location}: ${msg}`);
        });
      }
  
      // CASE : detail object
      if (
        data?.detail &&
        typeof data.detail === "object" &&
        !Array.isArray(data.detail)
      ) {
        if (data.detail?.message) messages.push(data.detail.message);
        if (data.detail?.suggestion) messages.push(data.detail.suggestion);
        if (data.detail?.error?.message) messages.push(data.detail.error.message);
      }
  
      // CASE : details string
      if (typeof data?.details === "string") {
        messages.push(data.details);
      }
  
      // CASE : detail string
      if (typeof data?.detail === "string") {
        messages.push(data.detail);
      }
  
      // CASE : JS error.message fallback
      if (!messages.length && error?.message) {
        messages.push(error.message);
      }
  
      return messages.length
        ? messages.join(". ")
        : "An unexpected error occurred. Please try again.";
    } catch (e) {
      console.error("Error parsing error message:", e);
      return "An unexpected error occurred. Please try again.";
    }
  };
  