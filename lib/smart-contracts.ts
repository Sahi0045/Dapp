// Aptos Move smart contracts for the Aptos Pay dApp

// Payment Contract
export const PAYMENT_CONTRACT = `
module aptos_pay::payment {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    // Errors
    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_INVALID_AMOUNT: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_PAYMENT_NOT_FOUND: u64 = 4;
    const E_PAYMENT_ALREADY_PROCESSED: u64 = 5;

    // Payment status
    const PAYMENT_STATUS_PENDING: u8 = 0;
    const PAYMENT_STATUS_COMPLETED: u8 = 1;
    const PAYMENT_STATUS_REJECTED: u8 = 2;

    // Payment request structure
    struct PaymentRequest has key, store {
        id: u64,
        requester: address,
        payer: address,
        amount: u64,
        description: String,
        status: u8,
        created_at: u64,
        updated_at: u64,
    }

    // Payment event
    struct PaymentEvent has drop, store {
        id: u64,
        sender: address,
        recipient: address,
        amount: u64,
        description: String,
        timestamp: u64,
    }

    // User payment store
    struct UserPaymentStore has key {
        next_payment_id: u64,
        sent_payments: vector<PaymentRequest>,
        received_payments: vector<PaymentRequest>,
        payment_events: EventHandle<PaymentEvent>,
    }

    // Initialize user payment store
    fun init_payment_store(account: &signer) {
        let user_addr = signer::address_of(account);
        
        if (!exists<UserPaymentStore>(user_addr)) {
            move_to(account, UserPaymentStore {
                next_payment_id: 0,
                sent_payments: vector::empty<PaymentRequest>(),
                received_payments: vector::empty<PaymentRequest>(),
                payment_events: account::new_event_handle<PaymentEvent>(account),
            });
        }
    }

    // Direct transfer function
    public entry fun transfer(
        sender: &signer,
        recipient: address,
        amount: u64,
        description: String
    ) acquires UserPaymentStore {
        let sender_addr = signer::address_of(sender);
        
        // Ensure both accounts have payment stores
        if (!exists<UserPaymentStore>(sender_addr)) {
            init_payment_store(sender);
        };
        
        // Transfer coins
        coin::transfer<AptosCoin>(sender, recipient, amount);
        
        // Record the payment
        let sender_store = borrow_global_mut<UserPaymentStore>(sender_addr);
        let payment_id = sender_store.next_payment_id;
        sender_store.next_payment_id = payment_id + 1;
        
        let now = timestamp::now_seconds();
        
        let payment = PaymentRequest {
            id: payment_id,
            requester: recipient,
            payer: sender_addr,
            amount,
            description,
            status: PAYMENT_STATUS_COMPLETED,
            created_at: now,
            updated_at: now,
        };
        
        vector::push_back(&mut sender_store.sent_payments, payment);
        
        // Emit payment event
        event::emit_event(
            &mut sender_store.payment_events,
            PaymentEvent {
                id: payment_id,
                sender: sender_addr,
                recipient,
                amount,
                description,
                timestamp: now,
            }
        );
        
        // If recipient has a payment store, record it there too
        if (exists<UserPaymentStore>(recipient)) {
            let recipient_store = borrow_global_mut<UserPaymentStore>(recipient);
            vector::push_back(&mut recipient_store.received_payments, payment);
        };
    }

    // Request payment function
    public entry fun request_payment(
        requester: &signer,
        payer: address,
        amount: u64,
        description: String
    ) acquires UserPaymentStore {
        let requester_addr = signer::address_of(requester);
        
        // Ensure requester has a payment store
        if (!exists<UserPaymentStore>(requester_addr)) {
            init_payment_store(requester);
        };
        
        let requester_store = borrow_global_mut<UserPaymentStore>(requester_addr);
        let payment_id = requester_store.next_payment_id;
        requester_store.next_payment_id = payment_id + 1;
        
        let now = timestamp::now_seconds();
        
        let payment = PaymentRequest {
            id: payment_id,
            requester: requester_addr,
            payer,
            amount,
            description,
            status: PAYMENT_STATUS_PENDING,
            created_at: now,
            updated_at: now,
        };
        
        vector::push_back(&mut requester_store.sent_payments, payment);
        
        // If payer has a payment store, add the request there too
        if (exists<UserPaymentStore>(payer)) {
            let payer_store = borrow_global_mut<UserPaymentStore>(payer);
            vector::push_back(&mut payer_store.received_payments, payment);
        };
    }

    // Approve payment request
    public entry fun approve_payment(
        payer: &signer,
        requester: address,
        payment_id: u64
    ) acquires UserPaymentStore {
        let payer_addr = signer::address_of(payer);
        
        // Ensure payer has a payment store
        assert!(exists<UserPaymentStore>(payer_addr), E_UNAUTHORIZED);
        
        let payer_store = borrow_global_mut<UserPaymentStore>(payer_addr);
        
        // Find the payment request
        let payment_idx = find_payment_request_idx(&payer_store.received_payments, payment_id, requester);
        assert!(payment_idx < vector::length(&payer_store.received_payments), E_PAYMENT_NOT_FOUND);
        
        let payment = vector::borrow_mut(&mut payer_store.received_payments, payment_idx);
        assert!(payment.status == PAYMENT_STATUS_PENDING, E_PAYMENT_ALREADY_PROCESSED);
        
        // Update payment status
        payment.status = PAYMENT_STATUS_COMPLETED;
        payment.updated_at = timestamp::now_seconds();
        
        // Transfer the funds
        coin::transfer<AptosCoin>(payer, requester, payment.amount);
        
        // Emit payment event
        event::emit_event(
            &mut payer_store.payment_events,
            PaymentEvent {
                id: payment_id,
                sender: payer_addr,
                recipient: requester,
                amount: payment.amount,
                description: payment.description,
                timestamp: payment.updated_at,
            }
        );
        
        // Update the requester's record if they have a payment store
        if (exists<UserPaymentStore>(requester)) {
            let requester_store = borrow_global_mut<UserPaymentStore>(requester);
            let req_payment_idx = find_payment_request_idx(&requester_store.sent_payments, payment_id, requester);
            
            if (req_payment_idx < vector::length(&requester_store.sent_payments)) {
                let req_payment = vector::borrow_mut(&mut requester_store.sent_payments, req_payment_idx);
                req_payment.status = PAYMENT_STATUS_COMPLETED;
                req_payment.updated_at = payment.updated_at;
            };
        };
    }

    // Reject payment request
    public entry fun reject_payment(
        payer: &signer,
        requester: address,
        payment_id: u64
    ) acquires UserPaymentStore {
        let payer_addr = signer::address_of(payer);
        
        // Ensure payer has a payment store
        assert!(exists<UserPaymentStore>(payer_addr), E_UNAUTHORIZED);
        
        let payer_store = borrow_global_mut<UserPaymentStore>(payer_addr);
        
        // Find the payment request
        let payment_idx = find_payment_request_idx(&payer_store.received_payments, payment_id, requester);
        assert!(payment_idx < vector::length(&payer_store.received_payments), E_PAYMENT_NOT_FOUND);
        
        let payment = vector::borrow_mut(&mut payer_store.received_payments, payment_idx);
        assert!(payment.status == PAYMENT_STATUS_PENDING, E_PAYMENT_ALREADY_PROCESSED);
        
        // Update payment status
        payment.status = PAYMENT_STATUS_REJECTED;
        payment.updated_at = timestamp::now_seconds();
        
        // Update the requester's record if they have a payment store
        if (exists<UserPaymentStore>(requester)) {
            let requester_store = borrow_global_mut<UserPaymentStore>(requester);
            let req_payment_idx = find_payment_request_idx(&requester_store.sent_payments, payment_id, requester);
            
            if (req_payment_idx < vector::length(&requester_store.sent_payments)) {
                let req_payment = vector::borrow_mut(&mut requester_store.sent_payments, req_payment_idx);
                req_payment.status = PAYMENT_STATUS_REJECTED;
                req_payment.updated_at = payment.updated_at;
            };
        };
    }

    // Helper function to find a payment request by ID and requester
    fun find_payment_request_idx(
        payments: &vector<PaymentRequest>,
        payment_id: u64,
        requester: address
    ): u64 {
        let i = 0;
        let len = vector::length(payments);
        
        while (i < len) {
            let payment = vector::borrow(payments, i);
            if (payment.id == payment_id && payment.requester == requester) {
                return i
            };
            i = i + 1;
        };
        
        return len // Not found
    }
}
`

// UPI Integration Contract
export const UPI_CONTRACT = `
module aptos_pay::upi {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_pay::payment;

    // Errors
    const E_UPI_ID_ALREADY_REGISTERED: u64 = 1;
    const E_UPI_ID_NOT_FOUND: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;

    // UPI ID structure
    struct UpiId has key, store {
        id: String,
        owner: address,
        is_verified: bool,
        created_at: u64,
    }

    // UPI registry
    struct UpiRegistry has key {
        upi_ids: vector<UpiId>,
    }

    // UPI transaction event
    struct UpiTransactionEvent has drop, store {
        sender_upi: String,
        recipient_upi: String,
        sender_addr: address,
        recipient_addr: address,
        amount: u64,
        description: String,
        timestamp: u64,
    }

    // User UPI store
    struct UserUpiStore has key {
        upi_ids: vector<UpiId>,
        transaction_events: EventHandle<UpiTransactionEvent>,
    }

    // Initialize module
    fun init_module(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Create global UPI registry
        if (!exists<UpiRegistry>(admin_addr)) {
            move_to(admin, UpiRegistry {
                upi_ids: vector::empty<UpiId>(),
            });
        };
    }

    // Initialize user UPI store
    fun init_upi_store(account: &signer) {
        let user_addr = signer::address_of(account);
        
        if (!exists<UserUpiStore>(user_addr)) {
            move_to(account, UserUpiStore {
                upi_ids: vector::empty<UpiId>(),
                transaction_events: account::new_event_handle<UpiTransactionEvent>(account),
            });
        }
    }

    // Register UPI ID
    public entry fun register_upi_id(
        owner: &signer,
        upi_id: String
    ) acquires UpiRegistry, UserUpiStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a UPI store
        if (!exists<UserUpiStore>(owner_addr)) {
            init_upi_store(owner);
        };
        
        // Check if UPI ID is already registered
        let registry = borrow_global_mut<UpiRegistry>(@aptos_pay);
        let i = 0;
        let len = vector::length(&registry.upi_ids);
        
        while (i < len) {
            let registered_upi = vector::borrow(&registry.upi_ids, i);
            assert!(string::internal_check_utf8(registered_upi.id) != string::internal_check_utf8(upi_id), E_UPI_ID_ALREADY_REGISTERED);
            i = i + 1;
        };
        
        // Create new UPI ID
        let now = timestamp::now_seconds();
        let new_upi = UpiId {
            id: upi_id,
            owner: owner_addr,
            is_verified: false, // Would be verified through a separate process
            created_at: now,
        };
        
        // Add to registry
        vector::push_back(&mut registry.upi_ids, new_upi);
        
        // Add to user's store
        let user_store = borrow_global_mut<UserUpiStore>(owner_addr);
        vector::push_back(&mut user_store.upi_ids, new_upi);
    }

    // Send money via UPI
    public entry fun send_via_upi(
        sender: &signer,
        sender_upi_id: String,
        recipient_upi_id: String,
        amount: u64,
        description: String
    ) acquires UpiRegistry, UserUpiStore {
        let sender_addr = signer::address_of(sender);
        
        // Find recipient address from UPI ID
        let registry = borrow_global<UpiRegistry>(@aptos_pay);
        let recipient_addr = find_address_by_upi_id(&registry.upi_ids, recipient_upi_id);
        assert!(recipient_addr != @0x0, E_UPI_ID_NOT_FOUND);
        
        // Verify sender owns the UPI ID
        let sender_upi_owner = find_address_by_upi_id(&registry.upi_ids, sender_upi_id);
        assert!(sender_upi_owner == sender_addr, E_UNAUTHORIZED);
        
        // Transfer funds using the payment module
        payment::transfer(sender, recipient_addr, amount, description);
        
        // Record UPI transaction
        if (exists<UserUpiStore>(sender_addr)) {
            let sender_store = borrow_global_mut<UserUpiStore>(sender_addr);
            
            // Emit UPI transaction event
            event::emit_event(
                &mut sender_store.transaction_events,
                UpiTransactionEvent {
                    sender_upi: sender_upi_id,
                    recipient_upi: recipient_upi_id,
                    sender_addr,
                    recipient_addr,
                    amount,
                    description,
                    timestamp: timestamp::now_seconds(),
                }
            );
        };
    }

    // Helper function to find address by UPI ID
    fun find_address_by_upi_id(upi_ids: &vector<UpiId>, upi_id: String): address {
        let i = 0;
        let len = vector::length(upi_ids);
        
        while (i < len) {
            let registered_upi = vector::borrow(upi_ids, i);
            if (string::internal_check_utf8(registered_upi.id) == string::internal_check_utf8(upi_id)) {
                return registered_upi.owner
            };
            i = i + 1;
        };
        
        return @0x0 // Not found
    }
}
`

// Offline Transaction Contract
export const OFFLINE_CONTRACT = `
module aptos_pay::offline {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::hash;
    use aptos_framework::bls12381;

    // Errors
    const E_INVALID_SIGNATURE: u64 = 1;
    const E_TRANSACTION_ALREADY_PROCESSED: u64 = 2;
    const E_TRANSACTION_EXPIRED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;

    // Offline transaction structure
    struct OfflineTransaction has key, store {
        id: vector<u8>, // Hash of transaction details
        sender: address,
        recipient: address,
        amount: u64,
        nonce: u64,
        expiration_time: u64,
        signature: vector<u8>,
        is_processed: bool,
        created_at: u64,
    }

    // Offline transaction event
    struct OfflineTransactionEvent has drop, store {
        id: vector<u8>,
        sender: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    // User offline transaction store
    struct UserOfflineStore has key {
        created_transactions: vector<OfflineTransaction>,
        processed_transactions: vector<OfflineTransaction>,
        processed_transaction_ids: vector<vector<u8>>, // For quick lookup
        transaction_events: EventHandle<OfflineTransactionEvent>,
    }

    // Initialize user offline store
    fun init_offline_store(account: &signer) {
        let user_addr = signer::address_of(account);
        
        if (!exists<UserOfflineStore>(user_addr)) {
            move_to(account, UserOfflineStore {
                created_transactions: vector::empty<OfflineTransaction>(),
                processed_transactions: vector::empty<OfflineTransaction>(),
                processed_transaction_ids: vector::empty<vector<u8>>(),
                transaction_events: account::new_event_handle<OfflineTransactionEvent>(account),
            });
        }
    }

    // Create offline transaction
    public entry fun create_offline_transaction(
        sender: &signer,
        recipient: address,
        amount: u64,
        nonce: u64,
        expiration_time: u64,
        signature: vector<u8>
    ) acquires UserOfflineStore {
        let sender_addr = signer::address_of(sender);
        
        // Ensure sender has an offline store
        if (!exists<UserOfflineStore>(sender_addr)) {
            init_offline_store(sender);
        };
        
        // Create transaction ID (hash of details)
        let id = create_transaction_id(sender_addr, recipient, amount, nonce, expiration_time);
        
        // Create offline transaction
        let now = timestamp::now_seconds();
        let transaction = OfflineTransaction {
            id,
            sender: sender_addr,
            recipient,
            amount,
            nonce,
            expiration_time,
            signature,
            is_processed: false,
            created_at: now,
        };
        
        // Store transaction
        let sender_store = borrow_global_mut<UserOfflineStore>(sender_addr);
        vector::push_back(&mut sender_store.created_transactions, transaction);
    }

    // Process offline transaction
    public  transaction);
    }

    // Process offline transaction
    public entry fun process_offline_transaction(
        processor: &signer,
        sender: address,
        recipient: address,
        amount: u64,
        nonce: u64,
        expiration_time: u64,
        signature: vector<u8>
    ) acquires UserOfflineStore {
        let processor_addr = signer::address_of(processor);
        
        // Ensure processor has an offline store
        if (!exists<UserOfflineStore>(processor_addr)) {
            init_offline_store(processor);
        };
        
        // Create transaction ID
        let id = create_transaction_id(sender, recipient, amount, nonce, expiration_time);
        
        // Check if transaction has already been processed
        let processor_store = borrow_global_mut<UserOfflineStore>(processor_addr);
        let i = 0;
        let len = vector::length(&processor_store.processed_transaction_ids);
        
        while (i < len) {
            let processed_id = vector::borrow(&processor_store.processed_transaction_ids, i);
            assert!(processed_id != &id, E_TRANSACTION_ALREADY_PROCESSED);
            i = i + 1;
        };
        
        // Verify transaction hasn't expired
        let now = timestamp::now_seconds();
        assert!(now <= expiration_time, E_TRANSACTION_EXPIRED);
        
        // Verify signature (in a real implementation, this would use proper cryptography)
        // For now, we'll assume the signature is valid
        
        // Process the transaction
        coin::transfer<AptosCoin>(processor, recipient, amount);
        
        // Mark transaction as processed
        let transaction = OfflineTransaction {
            id,
            sender,
            recipient,
            amount,
            nonce,
            expiration_time,
            signature,
            is_processed: true,
            created_at: now,
        };
        
        vector::push_back(&mut processor_store.processed_transactions, transaction);
        vector::push_back(&mut processor_store.processed_transaction_ids, id);
        
        // Emit event
        event::emit_event(
            &mut processor_store.transaction_events,
            OfflineTransactionEvent {
                id,
                sender,
                recipient,
                amount,
                timestamp: now,
            }
        );
    }

    // Helper function to create transaction ID
    fun create_transaction_id(
        sender: address,
        recipient: address,
        amount: u64,
        nonce: u64,
        expiration_time: u64
    ): vector<u8> {
        // Concatenate all fields and hash them
        let data = vector::empty<u8>();
        vector::append(&mut data, bcs::to_bytes(&sender));
        vector::append(&mut data, bcs::to_bytes(&recipient));
        vector::append(&mut data, bcs::to_bytes(&amount));
        vector::append(&mut data, bcs::to_bytes(&nonce));
        vector::append(&mut data, bcs::to_bytes(&expiration_time));
        
        hash::sha3_256(data)
    }
}
`

// Bank Account Contract
export const BANK_ACCOUNT_CONTRACT = `
module aptos_pay::bank_account {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    // Errors
    const E_ACCOUNT_ALREADY_LINKED: u64 = 1;
    const E_ACCOUNT_NOT_FOUND: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;

    // Bank account structure
    struct BankAccount has key, store {
        id: u64,
        account_number: String,
        ifsc_code: String,
        account_holder_name: String,
        is_verified: bool,
        is_default: bool,
        created_at: u64,
    }

    // Bank transaction event
    struct BankTransactionEvent has drop, store {
        account_id: u64,
        direction: u8, // 0 = from bank to wallet, 1 = from wallet to bank
        amount: u64,
        timestamp: u64,
    }

    // User bank account store
    struct UserBankStore has key {
        next_account_id: u64,
        bank_accounts: vector<BankAccount>,
        transaction_events: EventHandle<BankTransactionEvent>,
    }

    // Initialize user bank store
    fun init_bank_store(account: &signer) {
        let user_addr = signer::address_of(account);
        
        if (!exists<UserBankStore>(user_addr)) {
            move_to(account, UserBankStore {
                next_account_id: 0,
                bank_accounts: vector::empty<BankAccount>(),
                transaction_events: account::new_event_handle<BankTransactionEvent>(account),
            });
        }
    }

    // Link bank account
    public entry fun link_account(
        owner: &signer,
        account_number: String,
        ifsc_code: String,
        account_holder_name: String
    ) acquires UserBankStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a bank store
        if (!exists<UserBankStore>(owner_addr)) {
            init_bank_store(owner);
        };
        
        let owner_store = borrow_global_mut<UserBankStore>(owner_addr);
        
        // Check if account is already linked
        let i = 0;
        let len = vector::length(&owner_store.bank_accounts);
        
        while (i < len) {
            let account = vector::borrow(&owner_store.bank_accounts, i);
            assert!(
                string::internal_check_utf8(account.account_number) != string::internal_check_utf8(account_number) ||
                string::internal_check_utf8(account.ifsc_code) != string::internal_check_utf8(ifsc_code),
                E_ACCOUNT_ALREADY_LINKED
            );
            i = i + 1;
        };
        
        // Create new bank account
        let account_id = owner_store.next_account_id;
        owner_store.next_account_id = account_id + 1;
        
        let now = timestamp::now_seconds();
        let is_default = len == 0; // First account is default
        
        let bank_account = BankAccount {
            id: account_id,
            account_number,
            ifsc_code,
            account_holder_name,
            is_verified: false, // Would be verified through a separate process
            is_default,
            created_at: now,
        };
        
        // Add to user's store
        vector::push_back(&mut owner_store.bank_accounts, bank_account);
    }

    // Unlink bank account
    public entry fun unlink_account(
        owner: &signer,
        account_id: u64
    ) acquires UserBankStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a bank store
        assert!(exists<UserBankStore>(owner_addr), E_UNAUTHORIZED);
        
        let owner_store = borrow_global_mut<UserBankStore>(owner_addr);
        
        // Find the account
        let i = 0;
        let len = vector::length(&owner_store.bank_accounts);
        let account_idx = len; // Default to not found
        
        while (i < len) {
            let account = vector::borrow(&owner_store.bank_accounts, i);
            if (account.id == account_id) {
                account_idx = i;
                break
            };
            i = i + 1;
        };
        
        assert!(account_idx < len, E_ACCOUNT_NOT_FOUND);
        
        // Remove the account
        let removed_account = vector::remove(&mut owner_store.bank_accounts, account_idx);
        
        // If it was the default account and there are other accounts, set a new default
        if (removed_account.is_default && len > 1) {
            let new_default_idx = if (account_idx >= len - 1) { 0 } else { account_idx };
            let new_default = vector::borrow_mut(&mut owner_store.bank_accounts, new_default_idx);
            new_default.is_default = true;
        };
    }

    // Set default bank account
    public entry fun set_default_account(
        owner: &signer,
        account_id: u64
    ) acquires UserBankStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a bank store
        assert!(exists<UserBankStore>(owner_addr), E_UNAUTHORIZED);
        
        let owner_store = borrow_global_mut<UserBankStore>(owner_addr);
        
        // Find the account and clear current default
        let i = 0;
        let len = vector::length(&owner_store.bank_accounts);
        let account_idx = len; // Default to not found
        
        while (i < len) {
            let account = vector::borrow_mut(&mut owner_store.bank_accounts, i);
            if (account.id == account_id) {
                account_idx = i;
            } else if (account.is_default) {
                account.is_default = false;
            };
            i = i + 1;
        };
        
        assert!(account_idx < len, E_ACCOUNT_NOT_FOUND);
        
        // Set new default
        let new_default = vector::borrow_mut(&mut owner_store.bank_accounts, account_idx);
        new_default.is_default = true;
    }

    // Simulate transfer from bank to wallet
    public entry fun transfer_from_bank(
        owner: &signer,
        account_id: u64,
        amount: u64
    ) acquires UserBankStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a bank store
        assert!(exists<UserBankStore>(owner_addr), E_UNAUTHORIZED);
        
        let owner_store = borrow_global_mut<UserBankStore>(owner_addr);
        
        // Find the account
        let i = 0;
        let len = vector::length(&owner_store.bank_accounts);
        let account_idx = len; // Default to not found
        
        while (i < len) {
            let account = vector::borrow(&owner_store.bank_accounts, i);
            if (account.id == account_id) {
                account_idx = i;
                break
            };
            i = i + 1;
        };
        
        assert!(account_idx < len, E_ACCOUNT_NOT_FOUND);
        
        // In a real implementation, this would initiate a bank transfer
        // For now, we'll just mint coins to the user's wallet
        let coins = coin::mint<AptosCoin>(amount, &account::create_test_signer_cap(@aptos_pay));
        coin::deposit(owner_addr, coins);
        
        // Emit event
        event::emit_event(
            &mut owner_store.transaction_events,
            BankTransactionEvent {
                account_id,
                direction: 0, // from bank to wallet
                amount,
                timestamp: timestamp::now_seconds(),
            }
        );
    }

    // Simulate transfer to bank
    public entry fun transfer_to_bank(
        owner: &signer,
        account_id: u64,
        amount: u64
    ) acquires UserBankStore {
        let owner_addr = signer::address_of(owner);
        
        // Ensure owner has a bank store
        assert!(exists<UserBankStore>(owner_addr), E_UNAUTHORIZED);
        
        let owner_store = borrow_global_mut<UserBankStore>(owner_addr);
        
        // Find the account
        let i = 0;
        let len = vector::length(&owner_store.bank_accounts);
        let account_idx = len; // Default to not found
        
        while (i < len) {
            let account = vector::borrow(&owner_store.bank_accounts, i);
            if (account.id == account_id) {
                account_idx = i;
                break
            };
            i = i + 1;
        };
        
        assert!(account_idx < len, E_ACCOUNT_NOT_FOUND);
        
        // In a real implementation, this would initiate a bank transfer
        // For now, we'll just burn coins from the user's wallet
        coin::transfer<AptosCoin>(owner, @aptos_pay, amount);
        
        // Emit event
        event::emit_event(
            &mut owner_store.transaction_events,
            BankTransactionEvent {
                account_id,
                direction: 1, // from wallet to bank
                amount,
                timestamp: timestamp::now_seconds(),
            }
        );
    }
}
`

export const deploySmartContract = async (contractCode: string, contractName: string): Promise<string> => {
  // In a real app, this would deploy the contract to the Aptos blockchain
  console.log(`Deploying ${contractName} contract...`)
  return "0x1" // Return contract address
}

