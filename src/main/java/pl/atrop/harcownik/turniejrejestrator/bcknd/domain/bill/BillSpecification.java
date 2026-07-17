package pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 *
 * @author Michał Gnatowski
 * @date 24 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */

public record BillSpecification(
        int billId
        ,String userName
        ,Integer registrationId
        ,LocalDateTime datetime
        ,String clubName
        ,String nip
        ,String purchaser
        ,String billFullNumber
        ,String billPaymentDescLine1
        ,BigDecimal billPaymentValueLine1
        ,String billPaymentDescLine2
        ,BigDecimal billPaymentValueLine2
        ,String billPaymentDescLine3
        ,BigDecimal billPaymentValueLine3
        ,BigDecimal billTotalValueCash
        ,BigDecimal billTotalValueTransfer
        ,String paymentMethod
        ,String email
        ,String suffixPdfName
        ,String comment
        ) {

}
