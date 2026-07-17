package pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto;

import java.math.BigDecimal;

/**
 *
 * @author Michał Gnatowski
 * @date 23 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
public record CreateOrModifyBillDto(
        Integer billId,
        int userId,
        Integer registrationId,
        String purchaser,
        String nip,
        Boolean billNumberAuto,
        Integer billNumberManPrefix,
        String billPaymentDescLine1,
        BigDecimal billPaymentValueLine1,
        String billPaymentDescLine2,
        BigDecimal billPaymentValueLine2,
        String billPaymentDescLine3,
        BigDecimal billPaymentValueLine3,
        BigDecimal billTotalValue,
        PaymentMethod paymentMethod,
        String email,
        String suffixPdfName,
        String comment
        ) {

    public enum PaymentMethod { CASH, TRANSFER_14, TRANSFER_30 }
//    public enum PaymentMethod {
//        CASH("c"),
//        TRANSFER_14("f"),
//        TRANSFER_30("t");
//
//        private final String abbr;
//
//        PaymentMethod(String abbr) {
//            this.abbr = abbr;
//        }
//
//        /**
//         * One-letter abbreviation: CASH→c, TRANSFER_14→f, TRANSFER_30→t
//         */
//        public String abbr() {
//            return abbr;
//        }
//
//        /**
//         * Parse by abbreviation (case-insensitive). Throws if unknown.
//         */
//        public static PaymentMethod fromAbbr(String ch) {
//            switch (ch) {
//                case "c":
//                    return CASH;
//                case "f":
//                    return TRANSFER_14;
//                case "t":
//                    return TRANSFER_30;
//                default:
//                    throw new IllegalArgumentException("Unknown payment method abbr: " + ch);
//            }
//        }

        /**
         * Lenient parser from string abbreviations like "c", "F", etc.
         */
//        public static PaymentMethod fromAbbr(String s) {
//            if (s == null || s.isEmpty()) {
//                throw new IllegalArgumentException("Abbreviation is empty");
//            }
//            return fromAbbr(s);
//        }
//    }
}
