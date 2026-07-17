package pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.repositories.bill;

import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import pl.atrop.harcownik.turniejrejestrator.bcknd.application.rest.bill.dto.CreateOrModifyBillDto;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.RepositoryType;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill.BillRepository;
import pl.atrop.harcownik.turniejrejestrator.bcknd.domain.bill.BillSpecification;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.BillCommentsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.BillsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.GeneralSettingsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.RegistrationsFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.boundaries.UsersFacade;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.BillComments;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Bills;
import pl.atrop.harcownik.turniejrejestrator.bcknd.infrastructure.repository.db.sqldb.entities.Registrations;

/**
 *
 * @author Michał Gnatowski
 * @date 23 wrz 2025
 * @email michal.gnatowski@atrop.pl
 */
@RepositoryType("sql")
@Stateless
@TransactionAttribute(TransactionAttributeType.REQUIRED)
public class SqlBillRepository implements BillRepository {

    @Inject
    private BillsFacade billsFacade;
    @Inject
    private RegistrationsFacade registrationsFacade;
    @Inject
    private GeneralSettingsFacade generalSettingsFacade;
    @Inject
    private BillCommentsFacade billCommentsFacade;
    @Inject
    private UsersFacade usersFacade;

    @Override
    public int countByBills() {
        return billsFacade.count();
    }

    @Override
    public int findMaxBillNumber() {
        return billsFacade.findMaxBillNumber();
    }

    @Override
    @Transactional
    public int createOrModify(CreateOrModifyBillDto request) {
        System.out.println("create_or_modify, request:" + request);
        boolean create = request.billId() == null;
        Bills bill = (request.billId() == null)
                ? new Bills()
                : billsFacade.find(request.billId());

        if (request.registrationId() != null) {
            Registrations reg = registrationsFacade.find(request.registrationId());
            bill.setRegistrationId(reg);
        }
        bill.setUserId(usersFacade.find(request.userId()));

        bill.setDatetime(Date.from(Instant.now()));
        bill.setPurchaser(request.purchaser());
        bill.setNip(request.nip());
        if (create) { //gdy edycja nie dopuszczam zmiany numeru rachunku!
            String billSuffix = generalSettingsFacade.findOneByKey(GeneralSettingsFacade.BILL_NUMBER_SUFFIX).getValue1();
            int billNo = request.billNumberAuto() ? this.findMaxBillNumber() + 1 : request.billNumberManPrefix();
            bill.setBillNumber(billNo);
            bill.setBillFullnumber(billNo + billSuffix);
        }
        if (request.billPaymentDescLine1() != null || request.billPaymentValueLine1() != null) {
            bill.setPayment1Description(request.billPaymentDescLine1());
            bill.setPayment1Value(request.billPaymentValueLine1());
        }
        if (request.billPaymentDescLine2() != null || request.billPaymentValueLine2() != null) {
            bill.setPayment2Description(request.billPaymentDescLine2());
            bill.setPayment2Value(request.billPaymentValueLine2());
        }
        if (request.billPaymentDescLine3() != null || request.billPaymentValueLine3() != null) {
            bill.setPayment3Description(request.billPaymentDescLine3());
            bill.setPayment3Value(request.billPaymentValueLine3());
        }
        bill.setPaymentTotal(request.billTotalValue());

        bill.setPaymentMethod(request.paymentMethod().name());
        Optional.ofNullable(request.email())
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .ifPresent(bill::setEmail);
        Optional.ofNullable(request.suffixPdfName())
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .ifPresent(bill::setSuffixPdfName);

        if (request.billId() == null) {
            billsFacade.create(bill);
        } else {
            billsFacade.edit(bill);
        }
        if (create) {
            if (request.comment() != null && request.comment().trim().length() > 0) {
                BillComments billComment = new BillComments();
                billComment.setBillId(bill);
                billComment.setComment(request.comment());
                billCommentsFacade.create(billComment);
            }
        } else {
            BillComments billComment = billCommentsFacade.findOneBySth("billId", bill);
            if ((request.comment()==null || request.comment().length()==0) && billComment != null) {  //cz. był komentarz a teraz nie ma
                billCommentsFacade.remove(billComment);
            } else if (request.comment()!=null && billComment == null) {  //cz. jest komentarz a nie było
                BillComments billComment1 = new BillComments();
                billComment1.setBillId(bill);
                billComment1.setComment(request.comment());
                billCommentsFacade.create(billComment1);
            } else { //cz był komentarz i jest
                billComment.setComment(request.comment());
                billCommentsFacade.create(billComment);
            }
        }
        return bill.getId();

    }

    @Override
    public List<BillSpecification> findAll() {
        List<BillSpecification> allBillsSpecs = new ArrayList<>();
        billsFacade.findAllOrderBySth("id", false).forEach(bill -> {
            allBillsSpecs.add(createSpec(bill));
        });
        return allBillsSpecs;
    }

    private BillSpecification createSpec(Bills bill) {
        Integer regId = Optional.ofNullable(bill.getRegistrationId()).map(Registrations::getId).orElse(null);
        Registrations reg = regId != null ? registrationsFacade.find(regId) : null;
        String clubName = regId != null ? reg.getClubName() : null;
        /*
        StringBuilder clubFullNameSB = new StringBuilder();
        if (clubName!=null) {
            clubFullNameSB.append(clubName);
        }
        if (reg != null) {
            if (reg.getStreetNo() != null) {
                clubFullNameSB.append(", ").append(reg.getStreetNo());
            }
            if (reg.getCity() != null) {
                clubFullNameSB.append(", ").append(reg.getCity());
            }
            if (reg.getNip() != null) {
                clubFullNameSB.append(", ").append(reg.getNip());
            }
        }
        */
        BillComments billComment = billCommentsFacade.findOneBySth("billId", bill);
        ///List<BillComments> billComments = billCommentsFacade.findListBySthOrderBySth("billId", bill, "id", false);
//        List<String> billComments = billCommentsFacade
//        .findListBySthOrderBySth("billId", bill, "id", false)
//        .stream()
//        .map(bc -> bc.getComment()) //BillComment::getComment)
//        .toList();
        
        BigDecimal billTotalValueCash = bill.getPaymentMethod().equals("CASH") ? bill.getPaymentTotal() : null;
        BigDecimal billTotalValueTransfer = !bill.getPaymentMethod().equals("CASH") ? bill.getPaymentTotal() : null;
        
        return new BillSpecification(
                bill.getId()
                ,bill.getUserId().getUsername()
                ,regId
                ,convertDate2LocalDateTime(bill.getDatetime())
                ,clubName
                ,bill.getNip()
                ,bill.getPurchaser()
                ,bill.getBillFullnumber()
                ,bill.getPayment1Description()
                ,bill.getPayment1Value()
                ,bill.getPayment2Description()
                ,bill.getPayment2Value()
                ,bill.getPayment3Description()
                ,bill.getPayment3Value()
                ,billTotalValueCash
                ,billTotalValueTransfer
                ,bill.getPaymentMethod()
                ,bill.getEmail()
                ,bill.getSuffixPdfName()
                ,billComment != null ? billComment.getComment() : null
        );
    }

    private LocalDateTime convertDate2LocalDateTime(Date date) {
        ZoneId zone = ZoneId.of("Europe/Warsaw");     // pick your zone (don’t rely on default)
        LocalDateTime ldt = LocalDateTime.ofInstant(date.toInstant(), zone);
        return ldt;
    }

    @Override
    @Transactional
    public void delete(int billId) {
        Bills bill2Del = billsFacade.find(billId);
        BillComments billComment2Del = billCommentsFacade.findOneBySth("billId", bill2Del);
        if (billComment2Del != null) {
            billCommentsFacade.remove(billComment2Del);
        }
        billsFacade.remove(bill2Del);
    }

    @Override
    public BillSpecification edit(int billId) {
         Bills bill2Edit = billsFacade.find(billId);
         return createSpec(bill2Edit);
    }
}
