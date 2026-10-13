export type RequestData = {
    '3ds2.supported': boolean;
    back_url_f?: string;
    back_url_s?: string;
    merchantId: string;
    params: {
        order_id: string;
    };
    state: {
        in_progress: string;
        redirect: string;
    };
};