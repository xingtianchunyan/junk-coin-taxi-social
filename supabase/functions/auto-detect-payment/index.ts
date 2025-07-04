import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BlockchainTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: BlockchainTx[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://gwfuygmhcfmbzkewiuuv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZnV5Z21oY2ZtYnprZXdpdXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTQ3ODksImV4cCI6MjA2Njk3MDc4OX0.pe1U9ZqkH48mJpnAuFAPazpmv7aDX2MA_M4BheFyUGs'
    );

    const { rideRequestId } = await req.json();

    if (!rideRequestId) {
      return new Response(
        JSON.stringify({ error: 'rideRequestId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting payment detection for ride request: ${rideRequestId}`);

    // 获取用车需求详情
    const { data: rideRequest, error: rideError } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', rideRequestId)
      .single();

    if (rideError || !rideRequest) {
      console.error('Ride request not found:', rideError);
      return new Response(
        JSON.stringify({ error: 'Ride request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rideRequest.payment_required || !rideRequest.sender_wallet_address) {
      return new Response(
        JSON.stringify({ message: 'No payment required or sender address missing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取激活的钱包地址（接收方地址）
    const { data: walletAddresses, error: walletError } = await supabase
      .from('wallet_addresses')
      .select('*')
      .eq('is_active', true)
      .eq('symbol', rideRequest.payment_currency);

    if (walletError || !walletAddresses?.length) {
      console.error('No active wallet addresses found:', walletError);
      return new Response(
        JSON.stringify({ error: 'No active wallet addresses found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromAddress = rideRequest.sender_wallet_address.toLowerCase();
    const requestTime = new Date(rideRequest.requested_time);
    const timeWindow = 3 * 24 * 60 * 60; // 3天时间窗口（秒）
    const startTime = Math.floor(requestTime.getTime() / 1000) - timeWindow;
    const endTime = Math.floor(Date.now() / 1000);

    console.log(`Checking transactions from ${fromAddress} between ${new Date(startTime * 1000)} and ${new Date(endTime * 1000)}`);

    let foundTransaction = null;

    // 检查每个激活的钱包地址
    for (const wallet of walletAddresses) {
      const toAddress = wallet.address.toLowerCase();
      
      try {
        // 根据链名称选择合适的API
        let apiUrl = '';
        if (wallet.chain_name.toLowerCase().includes('ethereum') || wallet.chain_name.toLowerCase().includes('eth')) {
          apiUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
        } else if (wallet.chain_name.toLowerCase().includes('bsc') || wallet.chain_name.toLowerCase().includes('binance')) {
          apiUrl = `https://api.bscscan.com/api?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
        } else if (wallet.chain_name.toLowerCase().includes('polygon') || wallet.chain_name.toLowerCase().includes('matic')) {
          apiUrl = `https://api.polygonscan.com/api?module=account&action=txlist&address=${fromAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=YourApiKeyToken`;
        } else {
          console.log(`Unsupported chain: ${wallet.chain_name}`);
          continue;
        }

        console.log(`Querying blockchain API for ${wallet.chain_name}...`);
        
        const response = await fetch(apiUrl);
        const data: EtherscanResponse = await response.json();

        if (data.status === '1' && data.result?.length > 0) {
          // 查找匹配的交易
          const matchingTx = data.result.find(tx => {
            const txTime = parseInt(tx.timeStamp);
            const txToAddress = tx.to?.toLowerCase();
            const txValue = parseFloat(tx.value) / Math.pow(10, 18); // 转换为ETH单位
            
            console.log(`Checking transaction: ${tx.hash}, to: ${txToAddress}, value: ${txValue}, time: ${new Date(txTime * 1000)}`);
            
            return (
              txTime >= startTime &&
              txTime <= endTime &&
              txToAddress === toAddress &&
              Math.abs(txValue - (rideRequest.payment_amount || 0)) < 0.0001 // 允许小幅误差
            );
          });

          if (matchingTx) {
            foundTransaction = {
              hash: matchingTx.hash,
              from: matchingTx.from,
              to: matchingTx.to,
              value: matchingTx.value,
              timestamp: matchingTx.timeStamp,
              chain: wallet.chain_name
            };
            console.log('Found matching transaction:', foundTransaction);
            break;
          }
        }
      } catch (error) {
        console.error(`Error querying ${wallet.chain_name}:`, error);
        continue;
      }
    }

    if (foundTransaction) {
      // 更新支付状态
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({
          payment_status: 'confirmed',
          payment_tx_hash: foundTransaction.hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', rideRequestId);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update payment status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Payment status updated successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction: foundTransaction,
          message: 'Payment detected and confirmed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No matching transaction found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No matching payment transaction found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in auto-detect-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});