import { Middleware, isRejectedWithValue } from "@reduxjs/toolkit"
import Swal from "sweetalert2"

export const rtkQueryErrorLogger: Middleware =
    () => (next) => (action) => {
        if (isRejectedWithValue(action)) {
            const payload = action.payload as any;
            
            // Ignore 404 errors (used for unauthorized access)
            if (payload?.status === 404) {
                return next(action);
            }

            console.log('Error action:', action)
            
            // Try to get error message from different possible structures
            let errorMessage = 'An error occurred'
            
            if (payload?.data?.message) {
                errorMessage = payload.data.message
            } else if (payload?.message) {
                errorMessage = payload.message
            } else if (action.error?.message) {
                errorMessage = action.error.message
            }

            console.log('Error message:', errorMessage)
            
            Swal.fire({
                toast: true,
                icon: 'error',
                title: errorMessage,
                position: 'top-right',
                showConfirmButton: false,
                timer: 3000,
            })
        }
        return next(action)
    }