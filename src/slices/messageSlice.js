import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const messageSlice = createSlice({
  name: "message",
  initialState: [],
  reducers: {
    createMessage(state, action) {
      state.push({
        id: action.payload.id,
        type: action.payload.success ? "success" : "danger",
        title: action.payload.success ? "toast.success" : "toast.error",
        text: action.payload.message,
      });
    },
    removeMessage(state, action) {
      const index = state.findIndex((message) => message.id === action.payload);
      if (index !== -1) {
        state.splice(index, 1);
      }
    },
  },
});

export const createAsyncMessage = createAsyncThunk(
  "message/createAsyncMessage",
  async (payload, { dispatch, requestId }) => {
    // 確保 ID 是唯一的，如果 requestId 無效則使用時間戳
    const messageId =
      requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    dispatch(
      createMessage({
        ...payload,
        id: messageId,
      }),
    );
    setTimeout(() => {
      dispatch(removeMessage(messageId));
    }, 1500);
  },
);

export const { createMessage, removeMessage } = messageSlice.actions;

export default messageSlice.reducer;
