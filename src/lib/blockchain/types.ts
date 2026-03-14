export type CovalentLogEvent = {
  decoded?: {
    name?: string;
    params?: Array<{
      name: string;
      value: string;
    }>;
  };
  sender_address?: string;
  raw_log_data?: string;
};

export type CovalentTransaction = {
  tx_hash: string;
  successful: boolean;
  block_signed_at: string;
  from_address: string;
  to_address: string | null;
  value_quote: number | null;
  log_events?: CovalentLogEvent[];
};

export type CovalentResponse<T> = {
  data: {
    items: T[];
  };
};

export type ChainConfig = {
  id: number;
  name: string;
};
