import { Middleware, isRejectedWithValue } from "@reduxjs/toolkit"
import { ErrorResponse } from "./types"
import Swal from "sweetalert2"

export const rtkQueryErrorLogger: Middleware =
    () => (next) => (action) => {
        // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these matchers!
        if (isRejectedWithValue(action)) {
            console.log(action.payload)
            //@ts-expect-error
            const err = action.payload.data as ErrorResponse
            if(err.message){
                Swal.fire({
                    toast: true,
                    icon: 'error',
                    title: err.message,
                    position: 'top-right',
                    showConfirmButton: false,
                    timer: 3000,
                })
            }
            console.log(err)
        }
        return next(action)
    }